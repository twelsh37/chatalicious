#!/usr/bin/env node

/**
 * Script to reset the database
 * 
 * This will delete the local.db file and allow the application to recreate it
 * with the correct schema.
 * 
 * WARNING: This will delete all existing data!
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../local.db');

if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('✅ Database file deleted successfully');
    console.log('🔄 Restart your application to recreate the database with the correct schema');
  } catch (error) {
    console.error('❌ Error deleting database file:', error);
    process.exit(1);
  }
} else {
  console.log('ℹ️  Database file does not exist, nothing to delete');
}

console.log('\n📝 Next steps:');
console.log('1. Stop your development server (Ctrl+C)');
console.log('2. Run: yarn dev');
console.log('3. The database will be recreated with the correct schema'); 
