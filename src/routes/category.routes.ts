import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories.bind(categoryController));
router.get('/slug/:slug', categoryController.getCategoryBySlug.bind(categoryController));
router.get('/slug/:slug/posts', categoryController.getCategoryWithPosts.bind(categoryController));
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

// Protected routes (admin only)
router.post('/', authenticate, authorize('admin'), categoryController.createCategory.bind(categoryController));
router.put('/:id', authenticate, authorize('admin'), categoryController.updateCategory.bind(categoryController));
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory.bind(categoryController));

export default router;
