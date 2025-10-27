import { Router } from 'express';
import authRoutes from './auth.routes';
import postRoutes from './post.routes';
import categoryRoutes from './category.routes';
import uploadRoutes from './upload.routes';

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

// Upload routes
router.use('/upload', uploadRoutes);

export default router;
