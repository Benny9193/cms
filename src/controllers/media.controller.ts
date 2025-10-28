import { Response } from 'express';
import { AuthRequest } from '../types';
import mediaService from '../services/media.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAllMedia = async (req: AuthRequest, res: Response) => {
  try {
    const folder = req.query.folder as string;
    const userId = req.query.userId as string;

    const media = await mediaService.getAllMedia(folder, userId);
    return sendSuccess(res, media, 'Media fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getMediaById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const media = await mediaService.getMediaById(id);

    if (!media) {
      return sendError(res, 'Media not found', 404);
    }

    return sendSuccess(res, media, 'Media fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const updateMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { altText, caption, folder } = req.body;

    const media = await mediaService.updateMedia(id, { altText, caption, folder });
    return sendSuccess(res, media, 'Media updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await mediaService.deleteMedia(id);
    return sendSuccess(res, null, 'Media deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getFolders = async (req: AuthRequest, res: Response) => {
  try {
    const folders = await mediaService.getFolders();
    return sendSuccess(res, folders, 'Folders fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const searchMedia = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return sendError(res, 'Search query is required', 400);
    }

    const media = await mediaService.searchMedia(query);
    return sendSuccess(res, media, 'Search completed');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getMediaStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const stats = await mediaService.getMediaStats(userId);
    return sendSuccess(res, stats, 'Media stats fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
