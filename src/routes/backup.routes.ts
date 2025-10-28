import { Router } from 'express';
import {
  exportToJSON,
  exportPostsToCSV,
  importFromJSON,
  getBackupFiles,
  deleteBackup,
} from '../controllers/backup.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// All backup routes require admin privileges
router.use(authenticate, authorizeAdmin);

router.post('/export/json', exportToJSON);
router.post('/export/csv', exportPostsToCSV);
router.post('/import', importFromJSON);
router.get('/files', getBackupFiles);
router.delete('/files/:filename', deleteBackup);

export default router;
