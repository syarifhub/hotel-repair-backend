import { Router } from 'express';
import { repairRequestService } from '../services/RepairRequestService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { validate, updateRequestSchema } from '../middleware/validationMiddleware';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await repairRequestService.getDashboardStats();

    res.json({
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get all repair requests with filtering and pagination
router.get('/repair-requests', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      equipmentType: req.query.equipmentType as string,
      department: req.query.department as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await repairRequestService.listRequests(filters, pagination);

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching repair requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch repair requests'
    });
  }
});

// Update repair request
router.patch('/repair-requests/:id', validate(updateRequestSchema), async (req: AuthRequest, res) => {
  try {
    const adminId = req.admin.id;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updatedRequest = await repairRequestService.updateRequest(
      requestId,
      req.body,
      adminId
    );

    res.json({
      message: 'Repair request updated successfully',
      data: updatedRequest
    });
  } catch (error: any) {
    console.error('Error updating repair request:', error);

    if (error.message === 'Repair request not found') {
      res.status(404).json({
        error: 'Not Found',
        message: `Repair request with ID '${req.params.id}' not found`
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update repair request'
    });
  }
});

// Get repair request history
router.get('/repair-requests/:id/history', async (req, res) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const history = await repairRequestService.getRequestHistory(requestId);

    res.json({
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching request history:', error);

    if (error.message === 'Repair request not found') {
      res.status(404).json({
        error: 'Not Found',
        message: `Repair request with ID '${req.params.id}' not found`
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch request history'
    });
  }
});

// Delete repair request (only for cancelled requests)
router.delete('/repair-requests/:id', async (req: AuthRequest, res) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await repairRequestService.deleteRequest(requestId);

    res.json({
      message: 'Repair request deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting repair request:', error);

    if (error.message === 'Repair request not found') {
      res.status(404).json({
        error: 'Not Found',
        message: `Repair request with ID '${req.params.id}' not found`
      });
      return;
    }

    if (error.message === 'Cannot delete request that is not cancelled') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Only cancelled requests can be deleted'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete repair request'
    });
  }
});

// Export repair requests
router.get('/repair-requests/export', async (req, res) => {
  try {
    const format = req.query.format as string || 'json';
    
    const filters = {
      status: req.query.status as string,
      equipmentType: req.query.equipmentType as string,
      department: req.query.department as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const result = await repairRequestService.listRequests(filters, {
      page: 1,
      limit: 10000 // Get all for export
    });

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Title', 'Equipment Type', 'Department', 'Status', 'Reporter', 'Location', 'Created At'];
      const rows = result.data.map(req => [
        req._id,
        req.title,
        req.equipmentType,
        req.department,
        req.status,
        req.reporterName,
        req.location || '',
        new Date(req.createdAt).toISOString()
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=repair-requests.csv');
      res.send(csv);
    } else {
      res.json(result);
    }
  } catch (error: any) {
    console.error('Error exporting repair requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export repair requests'
    });
  }
});

export default router;
