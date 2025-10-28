import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './post.routes';
import categoryRoutes from './category.routes';
import uploadRoutes from './upload.routes';
import commentRoutes from './comment.routes';
import tagRoutes from './tag.routes';
import userRoutes from './user.routes';
import analyticsRoutes from './analytics.routes';
import mediaRoutes from './media.routes';
import revisionRoutes from './revision.routes';
import backupRoutes from './backup.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'CMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Post routes
router.use('/posts', postRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Tag routes
router.use('/tags', tagRoutes);

// Comment routes
router.use('/comments', commentRoutes);

// Upload routes
router.use('/upload', uploadRoutes);

// User management routes
router.use('/users', userRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Media library routes
router.use('/media', mediaRoutes);

// Revision history routes
router.use('/revisions', revisionRoutes);

// Backup and export routes
router.use('/backup', backupRoutes);

export default router;
