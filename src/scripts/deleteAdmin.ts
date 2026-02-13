import mongoose from 'mongoose';
import { Admin } from '../models/Admin';
import dotenv from 'dotenv';

dotenv.config();

const deleteAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('Connected to MongoDB');

    // Get username from command line argument
    const username = process.argv[2];

    if (!username) {
      console.error('❌ Error: Please provide username');
      console.log('Usage: npm run ts-node src/scripts/deleteAdmin.ts <username>');
      process.exit(1);
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username });

    if (!existingAdmin) {
      console.error(`❌ Admin user '${username}' not found`);
      process.exit(1);
    }

    // Count total admins
    const totalAdmins = await Admin.countDocuments();

    if (totalAdmins === 1) {
      console.error('❌ Cannot delete the last admin user!');
      console.log('System must have at least one admin.');
      process.exit(1);
    }

    // Delete the admin
    await Admin.findOneAndDelete({ username });

    console.log('✅ Admin deleted successfully!');
    console.log(`Username: ${username}`);
    console.log(`Remaining admins: ${totalAdmins - 1}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error deleting admin:', error.message);
    process.exit(1);
  }
};

deleteAdmin();
