import { Response } from 'express';
import uploadService from '../services/upload.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class UploadController {
  async uploadSingle(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const fileInfo = uploadService.processSingleFile(req.file);

      return sendSuccess(res, fileInfo, 'File uploaded successfully', 201);
    } catch (error: any) {
      console.error('Upload single file error:', error);
      return sendError(res, error.message || 'Failed to upload file', 400);
    }
  }

  async uploadMultiple(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return sendError(res, 'No files uploaded', 400);
      }

      const filesInfo = uploadService.processMultipleFiles(req.files);

      return sendSuccess(res, filesInfo, 'Files uploaded successfully', 201);
    } catch (error: any) {
      console.error('Upload multiple files error:', error);
      return sendError(res, error.message || 'Failed to upload files', 400);
    }
  }

  async listFiles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const files = await uploadService.listFiles();

      return sendSuccess(res, files, 'Files retrieved successfully');
    } catch (error: any) {
      console.error('List files error:', error);
      return sendError(res, error.message || 'Failed to retrieve files', 400);
    }
  }

  async getFileInfo(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { filename } = req.params;

      const fileInfo = await uploadService.getFileInfo(filename);

      return sendSuccess(res, fileInfo, 'File info retrieved successfully');
    } catch (error: any) {
      console.error('Get file info error:', error);
      const statusCode = error.message === 'File not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve file info', statusCode);
    }
  }

  async deleteFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can delete files
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can delete files', 403);
      }

      const { filename } = req.params;

      const result = await uploadService.deleteFile(filename);

      return sendSuccess(res, result, 'File deleted successfully');
    } catch (error: any) {
      console.error('Delete file error:', error);
      const statusCode = error.message === 'File not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to delete file', statusCode);
    }
  }
}

export default new UploadController();
