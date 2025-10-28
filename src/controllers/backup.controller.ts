import { Response } from 'express';
import { AuthRequest } from '../types';
import backupService from '../services/backup.service';
import { sendSuccess, sendError } from '../utils/response';

export const exportToJSON = async (req: AuthRequest, res: Response) => {
  try {
    const models = req.body.models; // Optional array of model names
    const filepath = await backupService.exportToJSON(models);
    return sendSuccess(res, { filepath }, 'Export completed successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const exportPostsToCSV = async (req: AuthRequest, res: Response) => {
  try {
    const filepath = await backupService.exportPostsToCSV();
    return sendSuccess(res, { filepath }, 'Export completed successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const importFromJSON = async (req: AuthRequest, res: Response) => {
  try {
    const { filepath } = req.body;

    if (!filepath) {
      return sendError(res, 'Filepath is required', 400);
    }

    await backupService.importFromJSON(filepath);
    return sendSuccess(res, null, 'Import completed successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getBackupFiles = async (req: AuthRequest, res: Response) => {
  try {
    const files = await backupService.getBackupFiles();
    return sendSuccess(res, files, 'Backup files fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const deleteBackup = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    await backupService.deleteBackup(filename);
    return sendSuccess(res, null, 'Backup deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
