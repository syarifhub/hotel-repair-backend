// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { RepairRequest, Counter } from '../models';

const migrateCounters = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    // หา requestNumber สูงสุดของแต่ละแผนก
    const departments = [
      { name: 'Front Office', code: 'FO' },
      { name: 'Housekeeping', code: 'HK' },
      { name: 'Food & Beverage', code: 'FB' },
      { name: 'Engineering', code: 'ENG' },
      { name: 'Accounting', code: 'ACC' },
      { name: 'Sales & Marketing', code: 'SM' },
      { name: 'Security', code: 'SEC' },
      { name: 'IT', code: 'IT' },
      { name: 'HR', code: 'HR' },
      { name: 'Other', code: 'OTH' }
    ];

    for (const dept of departments) {
      // หาคำขอล่าสุดของแผนกนี้
      const requests = await RepairRequest.find({ department: dept.name }).sort({ createdAt: -1 });
      
      let maxNumber = 0;
      for (const req of requests) {
        // ดึงเลขจาก requestNumber (เช่น IT-0008 -> 8)
        const match = req.requestNumber.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0]);
          if (num > maxNumber) maxNumber = num;
        }
      }

      if (maxNumber > 0) {
        // อัพเดท Counter
        await Counter.findOneAndUpdate(
          { name: `repairRequest_${dept.code}` },
          { seq: maxNumber },
          { upsert: true }
        );
        console.log(`✅ ${dept.code}: Set counter to ${maxNumber} (next will be ${dept.code}-${String(maxNumber + 1).padStart(4, '0')})`);
      }
    }

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrateCounters();
