// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { RepairRequest, Counter } from '../models';

const resetData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    // ลบข้อมูลคำขอซ่อมทั้งหมด
    const deletedRequests = await RepairRequest.deleteMany({});
    console.log(`🗑️  Deleted ${deletedRequests.deletedCount} repair requests`);

    // ลบ Counter ทั้งหมด
    const deletedCounters = await Counter.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCounters.deletedCount} counters`);

    console.log('✅ Data reset complete!');
    console.log('📝 Next request numbers will start from:');
    console.log('   - IT-0001, HK-0001, SEC-0001, etc.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetData();
