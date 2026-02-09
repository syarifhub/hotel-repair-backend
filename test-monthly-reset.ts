import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RepairRequest } from './src/models/RepairRequest';
import { Counter } from './src/models/Counter';

dotenv.config();

async function testMonthlyReset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check current counters
    console.log('\n📊 Current Counters:');
    const counters = await Counter.find({}).sort({ name: 1 });
    counters.forEach(counter => {
      console.log(`  ${counter.name}: ${counter.seq}`);
    });

    // Test 2: Check recent requests with month/year data
    console.log('\n📋 Recent Requests with Month/Year:');
    const recentRequests = await RepairRequest.find({
      createdMonth: { $exists: true },
      createdYear: { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('requestNumber department createdMonth createdYear createdAt');

    if (recentRequests.length === 0) {
      console.log('  No requests with month/year data found yet.');
      console.log('  Create a new request to test the monthly reset feature!');
    } else {
      recentRequests.forEach(req => {
        console.log(`  ${req.requestNumber} - ${req.department} - ${req.createdYear}-${String(req.createdMonth).padStart(2, '0')} - ${req.createdAt.toISOString()}`);
      });
    }

    // Test 3: Check old requests without month/year (backward compatibility)
    const oldRequestsCount = await RepairRequest.countDocuments({
      $or: [
        { createdMonth: { $exists: false } },
        { createdYear: { $exists: false } }
      ]
    });
    console.log(`\n🔄 Old requests (without month/year): ${oldRequestsCount}`);

    // Test 4: Group by month/year
    console.log('\n📅 Requests by Month/Year:');
    const byMonth = await RepairRequest.aggregate([
      {
        $match: {
          createdMonth: { $exists: true },
          createdYear: { $exists: true }
        }
      },
      {
        $group: {
          _id: { year: '$createdYear', month: '$createdMonth' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    if (byMonth.length === 0) {
      console.log('  No monthly data available yet.');
    } else {
      byMonth.forEach(item => {
        const monthName = new Date(item._id.year, item._id.month - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });
        console.log(`  ${monthName}: ${item.count} requests`);
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 To test monthly reset:');
    console.log('   1. Create a request now - it will get number like HK-0001');
    console.log('   2. The counter name will be: repairRequest_HK_2025_01 (or current month)');
    console.log('   3. Next month, the first request will reset to HK-0001 again');
    console.log('   4. Check the Reports page at http://localhost:5174/admin/reports');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testMonthlyReset();
