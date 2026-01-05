const admin = require('firebase-admin');
const path = require('path');

// Initialize admin with service account
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function setupClarvidaUser(email, password, role = 'owner') {
  console.log(`Setting up Clarvida user: ${email} as ${role}`);

  try {
    // Step 1: Create or get the user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`User already exists with UID: ${userRecord.uid}`);
      // Update password for existing user
      await auth.updateUser(userRecord.uid, {
        password: password,
        emailVerified: true,
      });
      console.log(`Updated password for existing user`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create the user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          emailVerified: true,
        });
        console.log(`Created new user with UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    const userId = userRecord.uid;

    // Step 2: Ensure Clarvida organization exists
    const orgRef = db.collection('organizations').doc('clarvida');
    const orgSnap = await orgRef.get();

    if (!orgSnap.exists) {
      // Create Clarvida organization
      await orgRef.set({
        id: 'clarvida',
        name: 'Clarvida',
        slug: 'clarvida',
        owner_id: userId,
        members: {
          [userId]: role,
        },
        branding: {
          logo_url: 'https://jobs.clarvida.com/system/production/assets/442891/original/pathways-hero.jpg',
          primary_color: '#0B5B5E',
          secondary_color: '#D4A03C',
          name: 'Clarvida',
        },
        settings: {
          allowed_domains: ['clarvida.com', 'hiapply.co'],
          require_approval: false,
          invite_only: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('Created Clarvida organization');
    } else {
      // Add user to existing organization
      const existingData = orgSnap.data();
      const members = existingData.members || {};
      members[userId] = role;

      await orgRef.update({
        members: members,
        updated_at: new Date().toISOString(),
      });
      console.log(`Added user to Clarvida organization as ${role}`);
    }

    console.log('\n✅ Setup complete!');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${userId}`);
    console.log(`   Role: ${role}`);
    console.log(`\n   Login URL: https://applycodes-2683f.web.app/clarvida/login`);

    return { userId, email, role };
  } catch (error) {
    console.error('Error setting up user:', error);
    throw error;
  }
}

// Run if called directly
const args = process.argv.slice(2);
if (args.length >= 2) {
  const email = args[0];
  const password = args[1];
  const role = args[2] || 'owner';

  setupClarvidaUser(email, password, role)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log('Usage: node setup-clarvida-user.js <email> <password> [role]');
  console.log('Example: node setup-clarvida-user.js james@hiapply.co MyPassword123 owner');
}

module.exports = { setupClarvidaUser };
