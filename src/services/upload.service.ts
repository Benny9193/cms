import fs from 'fs';
import path from 'path';
import { config } from '../config';

export class UploadService {
  /**
   * Process a single uploaded file
   */
  processSingleFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      url: `${this.getBaseUrl()}/uploads/${file.filename}`,
    };
  }

  /**
   * Process multiple uploaded files
   */
  processMultipleFiles(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      url: `${this.getBaseUrl()}/uploads/${file.filename}`,
    }));
  }

  /**
   * Delete a file by filename
   */
  async deleteFile(filename: string) {
    const filePath = path.join(config.upload.uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Security check: ensure file is in upload directory
    const realPath = fs.realpathSync(filePath);
    const realUploadDir = fs.realpathSync(config.upload.uploadDir);

    if (!realPath.startsWith(realUploadDir)) {
      throw new Error('Invalid file path');
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return { message: 'File deleted successfully' };
  }

  /**
   * Get list of uploaded files
   */
  async listFiles() {
    const uploadDir = config.upload.uploadDir;

    if (!fs.existsSync(uploadDir)) {
      return [];
    }

    const files = fs.readdirSync(uploadDir);

    return files
      .filter((file) => file !== '.gitkeep')
      .map((file) => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);

        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          path: `/uploads/${file}`,
          url: `${this.getBaseUrl()}/uploads/${file}`,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get base URL for building full file URLs
   */
  private getBaseUrl(): string {
    // In production, you should set this from environment variable
    const port = config.port;
    return `http://localhost:${port}`;
  }

  /**
   * Get file info by filename
   */
  async getFileInfo(filename: string) {
    const filePath = path.join(config.upload.uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename);

    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
      extension: ext,
      path: `/uploads/${filename}`,
      url: `${this.getBaseUrl()}/uploads/${filename}`,
    };
  }
}

export default new UploadService();
