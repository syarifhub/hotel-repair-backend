import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RepairRequest, Counter, NotificationLog } from '../models';

dotenv.config();

const resetTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  กำลังลบข้อมูลทดสอบ...\n');

    // ลบคำขอซ่อมทั้งหมด
    const deletedRequests = await RepairRequest.deleteMany({});
    console.log(`✅ ลบคำขอซ่อม: ${deletedRequests.deletedCount} รายการ`);

    // ลบ counters ทั้งหมด (เพื่อให้เลขเริ่มจาก 0001 ใหม่)
    const deletedCounters = await Counter.deleteMany({});
    console.log(`✅ ลบ counters: ${deletedCounters.deletedCount} รายการ`);

    // ลบ notification logs (ถ้ามี)
    const deletedLogs = await NotificationLog.deleteMany({});
    console.log(`✅ ลบ notification logs: ${deletedLogs.deletedCount} รายการ`);

    console.log('\n🎉 รีเซ็ตข้อมูลเสร็จสมบูรณ์!');
    console.log('📋 ข้อมูลที่เหลือ:');
    
    const remainingRequests = await RepairRequest.countDocuments();
    const remainingCounters = await Counter.countDocuments();
    const remainingLogs = await NotificationLog.countDocuments();
    
    console.log(`   - คำขอซ่อม: ${remainingRequests} รายการ`);
    console.log(`   - Counters: ${remainingCounters} รายการ`);
    console.log(`   - Notification logs: ${remainingLogs} รายการ`);

    console.log('\n⚠️  หมายเหตุ: ข้อมูล Admin ยังคงอยู่ (ไม่ถูกลบ)');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
};

resetTestData();
