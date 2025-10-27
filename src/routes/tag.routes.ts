import { Router } from 'express';
import tagController from '../controllers/tag.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', tagController.getAllTags.bind(tagController));
router.get('/slug/:slug', tagController.getTagBySlug.bind(tagController));
router.get('/slug/:slug/posts', tagController.getTagWithPosts.bind(tagController));
router.get('/:id', tagController.getTagById.bind(tagController));

// Protected routes (admin only)
router.post('/', authenticate, authorize('admin'), tagController.createTag.bind(tagController));
router.put('/:id', authenticate, authorize('admin'), tagController.updateTag.bind(tagController));
router.delete('/:id', authenticate, authorize('admin'), tagController.deleteTag.bind(tagController));

export default router;
