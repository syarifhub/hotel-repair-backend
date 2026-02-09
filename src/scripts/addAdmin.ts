import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { Admin } from '../models/Admin';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const addAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');
    console.log('\n📝 เพิ่ม Admin ใหม่\n');

    // Get admin details
    const username = await question('Username: ');
    const password = await question('Password: ');
    const fullName = await question('ชื่อ-นามสกุล: ');
    const email = await question('Email (optional): ');

    // Validate
    if (!username || !password || !fullName) {
      console.log('❌ กรุณากรอก Username, Password และชื่อ-นามสกุล');
      rl.close();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`❌ Username '${username}' มีอยู่แล้ว`);
      rl.close();
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    await Admin.create({
      username,
      passwordHash,
      fullName,
      email: email || undefined
    });

    console.log('\n✅ เพิ่ม Admin สำเร็จ!');
    console.log('📋 รายละเอียด:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   ชื่อ-นามสกุล: ${fullName}`);
    if (email) {
      console.log(`   Email: ${email}`);
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    rl.close();
    process.exit(1);
  }
};

addAdmin();
