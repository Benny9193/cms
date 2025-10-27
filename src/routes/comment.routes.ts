import { Router } from 'express';
import commentController from '../controllers/comment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/post/:postId', commentController.getCommentsByPost.bind(commentController));
router.get('/:id', commentController.getCommentById.bind(commentController));

// Protected routes (require authentication)
router.post('/', authenticate, commentController.createComment.bind(commentController));
router.put('/:id', authenticate, commentController.updateComment.bind(commentController));
router.delete('/:id', authenticate, commentController.deleteComment.bind(commentController));

// Admin routes
router.get('/', authenticate, authorize('admin'), commentController.getAllComments.bind(commentController));

export default router;
