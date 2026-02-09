// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
const result = dotenv.config();

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
  console.log('🔍 Environment variables check:');
  console.log('  - PORT:', process.env.PORT || 'NOT SET');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
  console.log('  - LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? `${process.env.LINE_CHANNEL_ACCESS_TOKEN.substring(0, 20)}...` : 'NOT SET');
  console.log('  - LINE_GROUP_ID:', process.env.LINE_GROUP_ID || 'NOT SET');
}

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import repairRequestRoutes from './routes/repairRequestRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import reportRoutes from './routes/reportRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'IT Repair System API is running' });
});

app.use('/api/repair-requests', repairRequestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-repair-system');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
  });
};

startServer();

export default app;
