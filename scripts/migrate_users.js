const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ─── Configuration ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gfzxlonhtgvxojyosskx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST be service_role, not anon
const FIREBASE_EXPORT_FILE = process.argv[2];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  process.exit(1);
}

if (!FIREBASE_EXPORT_FILE || !fs.existsSync(FIREBASE_EXPORT_FILE)) {
  console.error('❌ Error: Please provide a valid path to the Firebase users JSON export file.');
  console.error('Usage: node migrate_users.js ./users.json');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrateUsers() {
  console.log(`🚀 Starting migration from ${FIREBASE_EXPORT_FILE}...`);
  
  const rawData = fs.readFileSync(FIREBASE_EXPORT_FILE, 'utf8');
  let users;
  
  try {
    // Firebase export format has an array of users inside the "users" key
    const parsed = JSON.parse(rawData);
    users = parsed.users || parsed; 
  } catch (err) {
    console.error('❌ Error parsing JSON file:', err.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} users to migrate.`);
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      // Create user using the Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        id: user.localId, // MUST preserve the Firebase UID
        email: user.email,
        phone: user.phoneNumber,
        email_confirm: true, // Auto-confirm existing users
        phone_confirm: !!user.phoneNumber,
        // If passwordHash exists, pass it directly (Assumes Supabase is configured to accept Firebase Scrypt)
        password: user.passwordHash || undefined, 
        user_metadata: {
          full_name: user.displayName || '',
          provider: user.providerUserInfo?.[0]?.providerId || 'email',
          avatar_url: user.photoUrl || '',
        },
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ User skipped (Already exists): ${user.email || user.localId}`);
        } else {
          console.error(`❌ Failed to migrate user ${user.localId}:`, error.message);
          failCount++;
        }
      } else {
        console.log(`✅ Migrated: ${user.email || user.phoneNumber || user.localId}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception migrating user ${user.localId}:`, err.message);
      failCount++;
    }
    
    // Add a tiny delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n🎉 Migration Complete!');
  console.log(`Total Users: ${users.length}`);
  console.log(`Successfully Migrated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

migrateUsers();
