import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new campaign
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('platforms').isArray().withMessage('Platforms must be an array'),
    body('platforms.*').isIn(['linkedin', 'twitter', 'instagram']).withMessage('Invalid platform'),
  ],
  campaignController.createCampaign
);

// Get all campaigns
router.get(
  '/',
  [
    query('status').optional().isIn(['draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  campaignController.getCampaigns
);

// Get campaign details
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Invalid campaign ID')],
  campaignController.getCampaign
);

// Approve or reject a campaign
router.post(
  '/:id/approve',
  [
    param('id').isUUID().withMessage('Invalid campaign ID'),
    body('approved').isBoolean().withMessage('Approved must be a boolean'),
    body('comments').optional().isString(),
  ],
  campaignController.approveCampaign
);

// Get campaign metrics
router.get(
  '/:id/metrics',
  [param('id').isUUID().withMessage('Invalid campaign ID')],
  campaignController.getCampaignMetrics
);

// Delete a campaign
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid campaign ID')],
  campaignController.deleteCampaign
);

export default router;
