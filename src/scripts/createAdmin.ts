import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Admin } from '../models/Admin';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const fullName = process.env.ADMIN_FULLNAME || 'System Administrator';
    const email = process.env.ADMIN_EMAIL || '';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`⚠️  Admin user '${username}' already exists`);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      username,
      passwordHash,
      fullName,
      email: email || undefined
    });

    console.log('✅ Admin user created successfully!');
    console.log('📋 Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Full Name: ${fullName}`);
    if (email) {
      console.log(`   Email: ${email}`);
    }
    console.log('\n⚠️  Please change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
