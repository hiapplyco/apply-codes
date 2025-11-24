#!/usr/bin/env node

/**
 * Firestore Data Import Tool (ES Module Version)
 * Imports JSON data exported from Supabase into Firebase Firestore
 */

import admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '..', 'firebase-service-account.json');

// Initialize admin first
async function initializeFirebase() {
  try {
    const serviceAccountData = await fs.readFile(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountData);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error: Firebase service account file not found or invalid');
    console.error('Please download your service account key from Firebase Console');
    console.error('Expected path:', serviceAccountPath);
    console.error('Error details:', error.message);
    return false;
  }
}

// Get db and auth after initialization
let db;
let auth;

// Batch size for Firestore writes
const BATCH_SIZE = 500;

// Input directory (should match export tool output)
const INPUT_DIR = process.env.INPUT_DIR ||
  path.join(__dirname, '..', 'migration-data', '2025-09-28');

/**
 * Import auth users to Firebase Auth
 */
async function importAuthUsers() {
  console.log('Importing auth users to Firebase Auth...');

  try {
    const filePath = path.join(INPUT_DIR, 'auth_users.json');
    const usersData = JSON.parse(await fs.readFile(filePath, 'utf8'));

    const userMapping = {};
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersData) {
      try {
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
          uid: user.id, // Preserve original UID
          email: user.email,
          emailVerified: user.email_confirmed_at != null,
          disabled: false,
          metadata: {
            creationTime: user.created_at,
            lastSignInTime: user.last_sign_in_at
          },
          // Note: Password cannot be migrated directly
          // Users will need to reset their passwords
        });

        userMapping[user.id] = userRecord.uid;
        successCount++;
        console.log(`  ✓ Imported user: ${user.email}`);
      } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
          // User already exists, update mapping
          userMapping[user.id] = user.id;
          console.log(`  → User already exists: ${user.email}`);
        } else {
          console.error(`  ✗ Failed to import user ${user.email}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`  Imported ${successCount} users, ${errorCount} errors`);
    return userMapping;
  } catch (error) {
    console.error('Error importing auth users:', error);
    return {};
  }
}

/**
 * Convert PostgreSQL timestamp to Firestore Timestamp
 */
function convertTimestamp(value) {
  if (!value) return null;
  return admin.firestore.Timestamp.fromDate(new Date(value));
}

/**
 * Import user profiles and related data
 */
async function importUserProfiles(userMapping) {
  console.log('\nImporting user profiles...');

  try {
    const profilesPath = path.join(INPUT_DIR, 'profiles_with_auth.json');
    const profilesData = JSON.parse(await fs.readFile(profilesPath, 'utf8'));

    // Also load related data
    const subscriptionsData = await loadJsonFile('subscriptions.json');
    const usageTrackingData = await loadJsonFile('usage_tracking.json');

    let batch = db.batch();
    let batchCount = 0;
    let totalImported = 0;

    for (const profile of profilesData) {
      const userId = userMapping[profile.id] || profile.id;
      const docRef = db.collection('users').doc(userId);

      // Find related subscription
      const subscription = subscriptionsData.find(s => s.user_id === profile.id);
      const usage = usageTrackingData.find(u => u.user_id === profile.id);

      // Build user document
      const userData = {
        id: userId,
        email: profile.email,
        fullName: profile.full_name || '',
        avatarUrl: profile.avatar_url || null,
        phoneNumber: profile.phone_number || null,

        // Subscription info (denormalized)
        subscription: subscription ? {
          status: subscription.status,
          tier: subscription.tier,
          trialStartDate: convertTimestamp(subscription.trial_start_date),
          trialEndDate: convertTimestamp(subscription.trial_end_date),
          currentPeriodStart: convertTimestamp(subscription.current_period_start),
          currentPeriodEnd: convertTimestamp(subscription.current_period_end),
          stripeCustomerId: subscription.stripe_customer_id || null,
          stripeSubscriptionId: subscription.stripe_subscription_id || null,
        } : {
          status: 'trialing',
          tier: 'free_trial',
          trialStartDate: convertTimestamp(profile.created_at),
          trialEndDate: convertTimestamp(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)),
        },

        // Usage limits
        usage: usage ? {
          searchesCount: usage.searches_count || 0,
          candidatesEnrichedCount: usage.candidates_enriched_count || 0,
          aiCallsCount: usage.ai_calls_count || 0,
          videoInterviewsCount: usage.video_interviews_count || 0,
          periodStart: convertTimestamp(usage.period_start),
          periodEnd: convertTimestamp(usage.period_end),
        } : {
          searchesCount: 0,
          candidatesEnrichedCount: 0,
          aiCallsCount: 0,
          videoInterviewsCount: 0,
          periodStart: convertTimestamp(new Date()),
          periodEnd: convertTimestamp(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        },

        createdAt: convertTimestamp(profile.created_at),
        updatedAt: convertTimestamp(profile.updated_at),
      };

      batch.set(docRef, userData);
      batchCount++;

      // Commit batch if necessary
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        totalImported += batchCount;
        console.log(`  Imported ${totalImported} profiles...`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      totalImported += batchCount;
    }

    console.log(`  ✓ Imported ${totalImported} user profiles`);
  } catch (error) {
    console.error('Error importing profiles:', error);
  }
}

/**
 * Import saved candidates as subcollection
 */
async function importSavedCandidates(userMapping) {
  console.log('\nImporting saved candidates...');

  try {
    const candidatesData = await loadJsonFile('saved_candidates.json');

    // Group candidates by user
    const candidatesByUser = {};
    for (const candidate of candidatesData) {
      const userId = userMapping[candidate.user_id] || candidate.user_id;
      if (!candidatesByUser[userId]) {
        candidatesByUser[userId] = [];
      }
      candidatesByUser[userId].push(candidate);
    }

    let totalImported = 0;

    for (const [userId, candidates] of Object.entries(candidatesByUser)) {
      let batch = db.batch();
      let batchCount = 0;

      for (const candidate of candidates) {
        const docRef = db
          .collection('users')
          .doc(userId)
          .collection('savedCandidates')
          .doc(candidate.id.toString());

        const candidateData = {
          id: candidate.id.toString(),
          name: candidate.name,
          linkedinUrl: candidate.linkedin_url || null,
          jobTitle: candidate.job_title || null,
          company: candidate.company || null,
          location: candidate.location || null,
          seniorityLevel: candidate.seniority_level || null,
          workEmail: candidate.work_email || null,
          personalEmails: candidate.personal_emails || [],
          mobilePhone: candidate.mobile_phone || null,
          profileSummary: candidate.profile_summary || null,
          skills: candidate.skills || [],
          profileCompleteness: candidate.profile_completeness || null,
          searchString: candidate.search_string || null,
          source: candidate.source || 'linkedin',
          notes: candidate.notes || null,
          tags: candidate.tags || [],
          status: candidate.status || 'new',
          jobId: candidate.job_id?.toString() || null,
          createdAt: convertTimestamp(candidate.created_at),
          updatedAt: convertTimestamp(candidate.updated_at),
        };

        batch.set(docRef, candidateData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          totalImported += batchCount;
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        totalImported += batchCount;
      }
    }

    console.log(`  ✓ Imported ${totalImported} saved candidates`);
  } catch (error) {
    console.error('Error importing saved candidates:', error);
  }
}

/**
 * Import projects
 */
async function importProjects(userMapping) {
  console.log('\nImporting projects...');

  try {
    const projectsData = await loadJsonFile('projects.json');
    const projectCandidatesData = await loadJsonFile('project_candidates.json');

    let totalImported = 0;

    for (const project of projectsData) {
      const projectRef = db.collection('projects').doc(project.id);
      const userId = userMapping[project.user_id] || project.user_id;

      // Get project candidates
      const projectCandidates = projectCandidatesData.filter(
        pc => pc.project_id === project.id
      );

      const projectData = {
        id: project.id,
        userId: userId,
        members: [], // Initialize empty, can be populated later
        name: project.name,
        description: project.description || null,
        color: project.color || '#8B5CF6',
        icon: project.icon || 'folder',
        candidatesCount: projectCandidates.length,
        isArchived: project.is_archived || false,
        metadata: project.metadata || {},
        createdAt: convertTimestamp(project.created_at),
        updatedAt: convertTimestamp(project.updated_at),
      };

      await projectRef.set(projectData);

      // Import project candidates as subcollection
      if (projectCandidates.length > 0) {
        let batch = db.batch();
        let batchCount = 0;

        for (const pc of projectCandidates) {
          const candidateRef = projectRef
            .collection('candidates')
            .doc(pc.id);

          batch.set(candidateRef, {
            candidateRef: `/users/${userMapping[pc.added_by] || pc.added_by}/savedCandidates/${pc.candidate_id}`,
            addedBy: userMapping[pc.added_by] || pc.added_by,
            addedAt: convertTimestamp(pc.added_at),
            notes: pc.notes || null,
            tags: pc.tags || [],
          });

          batchCount++;

          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }

      totalImported++;
    }

    console.log(`  ✓ Imported ${totalImported} projects`);
  } catch (error) {
    console.error('Error importing projects:', error);
  }
}

/**
 * Import jobs
 */
async function importJobs(userMapping) {
  console.log('\nImporting jobs...');

  try {
    const jobsData = await loadJsonFile('jobs.json');

    let batch = db.batch();
    let batchCount = 0;
    let totalImported = 0;

    for (const job of jobsData) {
      const docRef = db.collection('jobs').doc(job.id.toString());
      const userId = userMapping[job.user_id] || job.user_id;

      const jobData = {
        id: job.id.toString(),
        userId: userId,
        title: job.title || '',
        company: job.company || '',
        description: job.description || '',
        requirements: job.requirements || [],
        niceToHave: job.nice_to_have || [],
        location: job.location || null,
        remote: job.remote || false,
        salaryMin: job.salary_min || null,
        salaryMax: job.salary_max || null,
        status: job.status || 'draft',
        candidatesCount: job.candidates_count || 0,
        createdAt: convertTimestamp(job.created_at),
        updatedAt: convertTimestamp(job.updated_at),
      };

      batch.set(docRef, jobData);
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        totalImported += batchCount;
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      totalImported += batchCount;
    }

    console.log(`  ✓ Imported ${totalImported} jobs`);
  } catch (error) {
    console.error('Error importing jobs:', error);
  }
}

/**
 * Import other collections
 */
async function importOtherCollections(userMapping) {
  console.log('\nImporting other collections...');

  // Import chat messages
  try {
    const chatData = await loadJsonFile('chat_messages.json');
    if (chatData.length > 0) {
      console.log(`  Importing ${chatData.length} chat messages...`);
      let batch = db.batch();
      let batchCount = 0;

      for (const message of chatData) {
        const docRef = db.collection('chatMessages').doc(message.id);
        batch.set(docRef, {
          ...message,
          userId: userMapping[message.user_id] || message.user_id,
          createdAt: convertTimestamp(message.created_at),
          updatedAt: convertTimestamp(message.updated_at)
        });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log(`  ✓ Imported chat messages`);
    }
  } catch (error) {
    console.error('  Error importing chat messages:', error.message);
  }

  // Import context items
  try {
    const contextData = await loadJsonFile('context_items.json');
    if (contextData.length > 0) {
      console.log(`  Importing ${contextData.length} context items...`);
      let batch = db.batch();
      let batchCount = 0;

      for (const item of contextData) {
        const docRef = db.collection('contextItems').doc(item.id);
        batch.set(docRef, {
          ...item,
          userId: userMapping[item.user_id] || item.user_id,
          createdAt: convertTimestamp(item.created_at),
          updatedAt: convertTimestamp(item.updated_at)
        });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log(`  ✓ Imported context items`);
    }
  } catch (error) {
    console.error('  Error importing context items:', error.message);
  }

  // Import agent outputs
  try {
    const agentData = await loadJsonFile('agent_outputs.json');
    if (agentData.length > 0) {
      console.log(`  Importing ${agentData.length} agent outputs...`);
      let batch = db.batch();
      let batchCount = 0;

      for (const output of agentData) {
        const docRef = db.collection('agentOutputs').doc(output.id);
        batch.set(docRef, {
          ...output,
          userId: userMapping[output.user_id] || output.user_id,
          createdAt: convertTimestamp(output.created_at),
          updatedAt: convertTimestamp(output.updated_at)
        });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log(`  ✓ Imported agent outputs`);
    }
  } catch (error) {
    console.error('  Error importing agent outputs:', error.message);
  }

  // Import search history
  try {
    const searchData = await loadJsonFile('search_history.json');
    if (searchData.length > 0) {
      console.log(`  Importing ${searchData.length} search history entries...`);
      let batch = db.batch();
      let batchCount = 0;

      for (const search of searchData) {
        const userId = userMapping[search.user_id] || search.user_id;
        const docRef = db
          .collection('users')
          .doc(userId)
          .collection('searchHistory')
          .doc(search.id);

        batch.set(docRef, {
          ...search,
          createdAt: convertTimestamp(search.created_at)
        });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log(`  ✓ Imported search history`);
    }
  } catch (error) {
    console.error('  Error importing search history:', error.message);
  }
}

/**
 * Load JSON file helper
 */
async function loadJsonFile(filename) {
  try {
    const filePath = path.join(INPUT_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Warning: Could not load ${filename}:`, error.message);
    return [];
  }
}

/**
 * Generate import summary
 */
async function generateImportSummary(userMapping) {
  const summary = {
    importDate: new Date().toISOString(),
    inputDirectory: INPUT_DIR,
    firebaseProject: admin.app().options.projectId,
    usersImported: Object.keys(userMapping).length,
    collections: {}
  };

  // Count documents in collections
  const collections = ['users', 'projects', 'jobs', 'chatMessages', 'contextItems', 'agentOutputs'];

  for (const collection of collections) {
    try {
      // Note: count() is not available in all Firebase versions
      // Using a simple query instead
      const snapshot = await db.collection(collection).limit(1000).get();
      summary.collections[collection] = snapshot.size;
    } catch (error) {
      summary.collections[collection] = 'error';
    }
  }

  const summaryPath = path.join(INPUT_DIR, 'import_summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\nImport summary saved to ${summaryPath}`);
  return summary;
}

/**
 * Main import function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Firestore Data Import Tool');
  console.log('='.repeat(60));
  console.log(`Input directory: ${INPUT_DIR}\n`);

  // Initialize Firebase first
  const initialized = await initializeFirebase();
  if (!initialized) {
    process.exit(1);
  }

  // Set db and auth after initialization
  db = admin.firestore();
  auth = admin.auth();

  try {
    // Check if input directory exists
    await fs.access(INPUT_DIR);

    // Import auth users first
    const userMapping = await importAuthUsers();

    // Import user profiles with subscription and usage data
    await importUserProfiles(userMapping);

    // Import saved candidates
    await importSavedCandidates(userMapping);

    // Import projects
    await importProjects(userMapping);

    // Import jobs
    await importJobs(userMapping);

    // Import other collections
    await importOtherCollections(userMapping);

    // Generate summary
    const summary = await generateImportSummary(userMapping);

    console.log('\n' + '='.repeat(60));
    console.log('Import completed successfully!');
    console.log('Collections imported:', Object.keys(summary.collections).length);
    console.log('Users imported:', summary.usersImported);
    console.log('='.repeat(60));

    // Important note about passwords
    console.log('\n⚠️  IMPORTANT: User passwords cannot be migrated directly.');
    console.log('Users will need to reset their passwords via email.');
    console.log('\nNext step: Run the password reset script:');
    console.log('  node scripts/send-password-resets.js');

  } catch (error) {
    console.error('\nFatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
main().catch(console.error);