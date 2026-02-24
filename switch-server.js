#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

const mode = process.argv[2];

if (mode === 'local') {
  // Switch to local development
  envContent = envContent.replace(
    /^EXPO_PUBLIC_API_URL=https:\/\/growsmartserver\.gogrowsmart\.com/m,
    '# EXPO_PUBLIC_API_URL=https://growsmartserver.gogrowsmart.com'
  );
  envContent = envContent.replace(
    /^# EXPO_PUBLIC_API_URL=http:\/\/.*:3000/m,
    'EXPO_PUBLIC_API_URL=http://172.17.2.72:3000'
  );
  console.log('✅ Switched to LOCAL development server (http://172.17.2.72:3000)');
} else if (mode === 'prod') {
  // Switch to production
  envContent = envContent.replace(
    /^EXPO_PUBLIC_API_URL=http:\/\/.*:3000/m,
    '# EXPO_PUBLIC_API_URL=http://172.17.2.72:3000'
  );
  envContent = envContent.replace(
    /^# EXPO_PUBLIC_API_URL=https:\/\/growsmartserver\.gogrowsmart\.com/m,
    'EXPO_PUBLIC_API_URL=https://growsmartserver.gogrowsmart.com'
  );
  console.log('✅ Switched to PRODUCTION server (https://growsmartserver.gogrowsmart.com)');
} else {
  console.log('Usage:');
  console.log('  node switch-server.js local  # Switch to local development server');
  console.log('  node switch-server.js prod   # Switch to production server');
  process.exit(1);
}

// Write back to .env
fs.writeFileSync(envPath, envContent);
console.log('📝 .env file updated. Restart your Expo app to apply changes.');
