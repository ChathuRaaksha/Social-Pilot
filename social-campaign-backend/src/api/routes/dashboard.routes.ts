import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard overview metrics
router.get(
  '/metrics',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  dashboardController.getDashboardMetrics
);

// Get recent activities
router.get(
  '/activities',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  dashboardController.getRecentActivities
);

// Get platform performance breakdown
router.get(
  '/platform-performance',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('platform').optional().isIn(['linkedin', 'twitter', 'instagram']),
  ],
  dashboardController.getPlatformPerformance
);

// Get engagement trends over time
router.get(
  '/engagement-trends',
  [
    query('period').optional().isIn(['24h', '7d', '30d', '90d']),
    query('platform').optional().isIn(['linkedin', 'twitter', 'instagram']),
  ],
  dashboardController.getEngagementTrends
);

export default router;
