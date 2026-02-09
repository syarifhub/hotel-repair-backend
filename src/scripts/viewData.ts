import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RepairRequest } from '../models/RepairRequest';

dotenv.config();

const viewData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB\n');

    // ดูข้อมูลทั้งหมด
    const requests = await RepairRequest.find()
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'fullName')
      .populate('statusHistory.changedBy', 'fullName');

    console.log(`📊 Total Requests: ${requests.length}\n`);
    console.log('=' .repeat(80));

    requests.forEach((req, index) => {
      console.log(`\n${index + 1}. ${req.title}`);
      console.log(`   ID: ${req._id}`);
      console.log(`   Equipment: ${req.equipmentType}`);
      console.log(`   Department: ${req.department}`);
      console.log(`   Reporter: ${req.reporterName}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Created: ${new Date(req.createdAt).toLocaleString('th-TH')}`);
      
      if (req.statusHistory && req.statusHistory.length > 0) {
        console.log(`   Status History:`);
        req.statusHistory.forEach((history: any, i: number) => {
          const changedBy = history.changedBy?.fullName || 'System';
          console.log(`     ${i + 1}. ${history.newStatus} - ${changedBy} (${new Date(history.changedAt).toLocaleString('th-TH')})`);
          if (history.notes) {
            console.log(`        Notes: ${history.notes}`);
          }
        });
      }
      console.log('-'.repeat(80));
    });

    // สถิติ
    console.log('\n📈 Statistics:');
    const stats = await RepairRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

viewData();
