/**
 * Clarvida Data Migration Script
 *
 * This script migrates existing Clarvida-related data to the new organization-based structure.
 * It will:
 * 1. Create the Clarvida organization if it doesn't exist
 * 2. Find all jobs with source: 'clarvida' and add organization_id
 * 3. Find all related projects and add organization_id
 * 4. Add relevant users to the Clarvida organization membership
 *
 * Run with: node migrate-clarvida-data.js
 */

const admin = require('firebase-admin');
const { logger } = require("firebase-functions/v2");
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

const CLARVIDA_ORG_ID = 'clarvida';

// Clarvida organization configuration
const CLARVIDA_ORG_CONFIG = {
  name: 'Clarvida',
  slug: 'clarvida',
  branding: {
    logo_url: '/lovable-uploads/a36a9030-18dd-4eec-bf47-21de5406f97b.png',
    primary_color: '#8B5CF6',
    secondary_color: '#A18472',
    name: 'Clarvida'
  },
  settings: {
    allowed_domains: ['clarvida.com'],
    require_approval: false,
    invite_only: true
  }
};

async function createClarvidaOrganization(ownerId) {
  logger.info('Creating Clarvida organization...');

  const orgRef = db.collection('organizations').doc(CLARVIDA_ORG_ID);
  const existingOrg = await orgRef.get();

  if (existingOrg.exists) {
    logger.info('Clarvida organization already exists');
    return existingOrg.data();
  }

  const now = new Date().toISOString();
  const orgData = {
    ...CLARVIDA_ORG_CONFIG,
    owner_id: ownerId,
    members: {
      [ownerId]: 'owner'
    },
    created_at: now,
    updated_at: now
  };

  await orgRef.set(orgData);
  logger.info('Clarvida organization created successfully');
  return orgData;
}

async function addUserToOrganization(userId, role = 'member') {
  logger.info(`Adding user ${userId} to Clarvida with role: ${role}`);

  const orgRef = db.collection('organizations').doc(CLARVIDA_ORG_ID);
  const orgSnap = await orgRef.get();

  if (!orgSnap.exists) {
    throw new Error('Clarvida organization not found');
  }

  const orgData = orgSnap.data();

  // Don't overwrite if user already has a role
  if (orgData.members && orgData.members[userId]) {
    logger.info(`User ${userId} already has role: ${orgData.members[userId]}`);
    return;
  }

  await orgRef.update({
    [`members.${userId}`]: role,
    updated_at: new Date().toISOString()
  });

  // Create user_organizations record
  await db.collection('user_organizations').add({
    user_id: userId,
    organization_id: CLARVIDA_ORG_ID,
    role: role,
    joined_at: new Date().toISOString()
  });

  logger.info(`User ${userId} added to Clarvida`);
}

async function migrateJobs() {
  logger.info('\nMigrating jobs with source: clarvida...');

  const jobsRef = db.collection('jobs');
  const clarvidaJobs = await jobsRef.where('source', '==', 'clarvida').get();

  if (clarvidaJobs.empty) {
    logger.info('No Clarvida jobs found');
    return { count: 0, userIds: new Set() };
  }

  const userIds = new Set();
  let migratedCount = 0;
  let skippedCount = 0;

  const batch = db.batch();

  clarvidaJobs.docs.forEach((doc) => {
    const data = doc.data();

    // Collect user IDs
    if (data.user_id) {
      userIds.add(data.user_id);
    }
    if (data.userId) {
      userIds.add(data.userId);
    }

    // Skip if already has organization_id
    if (data.organization_id === CLARVIDA_ORG_ID) {
      skippedCount++;
      return;
    }

    batch.update(doc.ref, {
      organization_id: CLARVIDA_ORG_ID,
      updated_at: new Date().toISOString()
    });

    migratedCount++;
  });

  if (migratedCount > 0) {
    await batch.commit();
  }

  logger.info(`Migrated ${migratedCount} jobs, skipped ${skippedCount} (already migrated)`);
  logger.info(`Found ${userIds.size} unique users`);

  return { count: migratedCount, userIds };
}

async function migrateProjects(userIds) {
  logger.info('\nMigrating projects for Clarvida users...');

  let migratedCount = 0;
  let skippedCount = 0;

  for (const userId of userIds) {
    const projectsRef = db.collection('projects');
    const userProjects = await projectsRef.where('user_id', '==', userId).get();

    if (userProjects.empty) continue;

    const batch = db.batch();

    userProjects.docs.forEach((doc) => {
      const data = doc.data();

      // Skip if already has organization_id
      if (data.organization_id === CLARVIDA_ORG_ID) {
        skippedCount++;
        return;
      }

      batch.update(doc.ref, {
        organization_id: CLARVIDA_ORG_ID,
        updated_at: new Date().toISOString()
      });

      migratedCount++;
    });

    await batch.commit();
  }

  logger.info(`Migrated ${migratedCount} projects, skipped ${skippedCount}`);
  return migratedCount;
}

async function migrateContextItems(userIds) {
  logger.info('\nMigrating context items for Clarvida users...');

  let migratedCount = 0;

  for (const userId of userIds) {
    const contextRef = db.collection('context_items');
    const userContext = await contextRef.where('user_id', '==', userId).get();

    if (userContext.empty) continue;

    const batch = db.batch();

    userContext.docs.forEach((doc) => {
      const data = doc.data();

      if (data.organization_id === CLARVIDA_ORG_ID) return;

      batch.update(doc.ref, {
        organization_id: CLARVIDA_ORG_ID
      });

      migratedCount++;
    });

    await batch.commit();
  }

  logger.info(`Migrated ${migratedCount} context items`);
  return migratedCount;
}

async function migrateSearchHistory(userIds) {
  logger.info('\nMigrating search history for Clarvida users...');

  let migratedCount = 0;

  for (const userId of userIds) {
    const searchRef = db.collection('search_history');
    const userSearches = await searchRef.where('user_id', '==', userId).get();

    if (userSearches.empty) continue;

    const batch = db.batch();

    userSearches.docs.forEach((doc) => {
      const data = doc.data();

      if (data.organization_id === CLARVIDA_ORG_ID) return;

      batch.update(doc.ref, {
        organization_id: CLARVIDA_ORG_ID
      });

      migratedCount++;
    });

    await batch.commit();
  }

  logger.info(`Migrated ${migratedCount} search history records`);
  return migratedCount;
}

async function runMigration() {
  logger.info('='.repeat(60));
  logger.info('CLARVIDA DATA MIGRATION');
  logger.info('='.repeat(60));
  logger.info(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Migrate jobs and collect user IDs
    const { userIds } = await migrateJobs();

    if (userIds.size === 0) {
      logger.info('\nNo users found to migrate. Checking for existing Clarvida org...');
    }

    // Step 2: Create organization if needed (use first user as owner, or a placeholder)
    const userIdsArray = Array.from(userIds);
    const ownerId = userIdsArray[0] || 'system';
    await createClarvidaOrganization(ownerId);

    // Step 3: Add all users to organization
    logger.info('\nAdding users to Clarvida organization...');
    for (let i = 0; i < userIdsArray.length; i++) {
      const userId = userIdsArray[i];
      // First user becomes owner, rest are members
      const role = i === 0 ? 'owner' : 'member';
      await addUserToOrganization(userId, role);
    }

    // Step 4: Migrate related collections
    await migrateProjects(userIds);
    await migrateContextItems(userIds);
    await migrateSearchHistory(userIds);

    logger.info('\n' + '='.repeat(60));
    logger.info('MIGRATION COMPLETE');
    logger.info('='.repeat(60));
    logger.info(`Finished at: ${new Date().toISOString()}`);

  } catch (error) {
    logger.error('\nMIGRATION ERROR:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Export for testing or manual invocation
module.exports = {
  createClarvidaOrganization,
  addUserToOrganization,
  migrateJobs,
  migrateProjects,
  migrateContextItems,
  migrateSearchHistory,
  runMigration
};

// Run if called directly
if (require.main === module) {
  runMigration();
}
