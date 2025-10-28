import { Router } from 'express';
import postController from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';
import relatedPostsService from '../services/relatedPosts.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Public routes
router.get('/', postController.getAllPosts.bind(postController));
router.get('/search', postController.searchPosts.bind(postController));
router.get('/slug/:slug', postController.getPostBySlug.bind(postController));
router.get('/:id', postController.getPostById.bind(postController));

// Related posts
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const posts = await relatedPostsService.getRelatedPosts(id, limit);
    return sendSuccess(res, posts, 'Related posts fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
});

// Protected routes (require authentication)
router.post('/', authenticate, postController.createPost.bind(postController));
router.put('/:id', authenticate, postController.updatePost.bind(postController));
router.delete('/:id', authenticate, postController.deletePost.bind(postController));

export default router;
