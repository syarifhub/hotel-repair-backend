import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Admin } from '../models/Admin';

dotenv.config();

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    const username = 'admin';
    const newPassword = 'Admin2018';

    // Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log(`❌ Admin user '${username}' not found`);
      process.exit(1);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    admin.passwordHash = passwordHash;
    await admin.save();

    console.log('✅ Admin password updated successfully!');
    console.log('📋 New credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }
};

updateAdminPassword();
