import { Router } from 'express';
import {
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  getFolders,
  searchMedia,
  getMediaStats,
} from '../controllers/media.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// All media routes require authentication
router.use(authenticate);

router.get('/', getAllMedia);
router.get('/folders', getFolders);
router.get('/search', searchMedia);
router.get('/stats', getMediaStats);
router.get('/:id', getMediaById);
router.put('/:id', updateMedia);
router.delete('/:id', authorizeAdmin, deleteMedia);

export default router;
