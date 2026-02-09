import { Router } from 'express';
import { repairRequestService } from '../services/RepairRequestService';
import { notificationService } from '../services/NotificationService';
import { validate, repairRequestSchema } from '../middleware/validationMiddleware';

const router = Router();

// Public endpoint - Create new repair request
router.post('/', validate(repairRequestSchema), async (req, res) => {
  try {
    const request = await repairRequestService.createRequest(req.body);

    // Send LINE notification asynchronously (don't wait for it)
    notificationService.sendNewRequestNotification(request).catch(error => {
      console.error('Failed to send notification:', error);
    });

    res.status(201).json({
      message: 'Repair request created successfully',
      data: request
    });
  } catch (error: any) {
    console.error('Error creating repair request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create repair request'
    });
  }
});

// Public endpoint - Get repair request by ID
router.get('/:id', async (req, res) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await repairRequestService.getRequestById(requestId);

    if (!request) {
      res.status(404).json({
        error: 'Not Found',
        message: `Repair request with ID '${req.params.id}' not found`
      });
      return;
    }

    res.json({
      data: request
    });
  } catch (error: any) {
    console.error('Error fetching repair request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch repair request'
    });
  }
});

// Public endpoint - Cancel repair request
router.post('/:id/cancel', async (req, res) => {
  try {
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request = await repairRequestService.cancelRequest(requestId);

    if (!request) {
      res.status(404).json({
        error: 'Not Found',
        message: `Repair request with ID '${req.params.id}' not found`
      });
      return;
    }

    // Send LINE notification asynchronously
    notificationService.sendCancelNotification(request).catch(error => {
      console.error('Failed to send cancellation notification:', error);
    });

    res.json({
      message: 'Repair request cancelled successfully',
      data: request
    });
  } catch (error: any) {
    console.error('Error cancelling repair request:', error);
    
    if (error.message === 'Cannot cancel request that is not pending') {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel repair request'
    });
  }
});

export default router;
