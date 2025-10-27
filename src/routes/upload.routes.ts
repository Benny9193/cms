import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

// Upload single file
router.post('/single', uploadSingle, uploadController.uploadSingle.bind(uploadController));

// Upload multiple files
router.post('/multiple', uploadMultiple, uploadController.uploadMultiple.bind(uploadController));

// List all uploaded files
router.get('/', uploadController.listFiles.bind(uploadController));

// Get file info by filename
router.get('/:filename', uploadController.getFileInfo.bind(uploadController));

// Delete file (admin only)
router.delete('/:filename', authorize('admin'), uploadController.deleteFile.bind(uploadController));

export default router;
