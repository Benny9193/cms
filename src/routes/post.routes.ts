import { Router } from 'express';
import postController from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', postController.getAllPosts.bind(postController));
router.get('/search', postController.searchPosts.bind(postController));
router.get('/slug/:slug', postController.getPostBySlug.bind(postController));
router.get('/:id', postController.getPostById.bind(postController));

// Protected routes (require authentication)
router.post('/', authenticate, postController.createPost.bind(postController));
router.put('/:id', authenticate, postController.updatePost.bind(postController));
router.delete('/:id', authenticate, postController.deletePost.bind(postController));

export default router;
