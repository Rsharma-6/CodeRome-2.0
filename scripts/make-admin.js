#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../storage-service/.env') });
const mongoose = require('mongoose');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require(path.join(__dirname, '../storage-service/src/models/User'));
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  user.isAdmin = true;
  await user.save();
  console.log(`✓ ${user.username} (${email}) is now an admin`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
