import { Router } from 'express';
import { reportService } from '../services/ReportService';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ทุก route ต้องการการยืนยันตัวตน
router.use(authMiddleware);

// GET /api/reports/monthly-stats?month=1&year=2024
router.get('/monthly-stats', async (req, res) => {
  try {
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid month (1-12) and year (2000-2100) are required'
      });
    }

    const stats = await reportService.getMonthlyStats(month, year);
    res.json({ data: stats });
  } catch (error: any) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch monthly statistics'
    });
  }
});

// GET /api/reports/monthly-requests?month=1&year=2024&page=1&limit=20
router.get('/monthly-requests', async (req, res) => {
  try {
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc';

    if (!month || !year || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid month (1-12) and year (2000-2100) are required'
      });
    }

    const result = await reportService.getMonthlyRequests({
      month,
      year,
      page,
      limit,
      sortBy,
      sortOrder
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching monthly requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch monthly requests'
    });
  }
});

// GET /api/reports/available-months
router.get('/available-months', async (req, res) => {
  try {
    const months = await reportService.getAvailableMonths();
    res.json({ data: months });
  } catch (error: any) {
    console.error('Error fetching available months:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch available months'
    });
  }
});

export default router;
