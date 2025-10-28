import { Router } from 'express';
import {
  trackPostView,
  getPostViewCount,
  getMostViewedPosts,
  getDashboardStats,
  getViewTrend,
  trackSocialShare,
  getSocialShareStats,
} from '../controllers/analytics.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/posts/:postId/views', trackPostView);
router.post('/posts/:postId/shares', trackSocialShare);

// Authenticated routes
router.use(authenticate);

router.get('/posts/:postId/views/count', getPostViewCount);
router.get('/posts/:postId/shares/stats', getSocialShareStats);
router.get('/posts/most-viewed', getMostViewedPosts);

// Admin routes
router.get('/dashboard/stats', authorizeAdmin, getDashboardStats);
router.get('/views/trend', authorizeAdmin, getViewTrend);

export default router;
