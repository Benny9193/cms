import { Router } from 'express';
import {
  getPostRevisions,
  getRevisionById,
  restoreRevision,
} from '../controllers/revision.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All revision routes require authentication
router.use(authenticate);

router.get('/posts/:postId/revisions', getPostRevisions);
router.get('/:id', getRevisionById);
router.post('/:id/restore', restoreRevision);

export default router;
