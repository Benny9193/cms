import { Response } from 'express';
import { AuthRequest } from '../types';
import revisionService from '../services/revision.service';
import { sendSuccess, sendError } from '../utils/response';

export const getPostRevisions = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const revisions = await revisionService.getPostRevisions(postId);
    return sendSuccess(res, revisions, 'Revisions fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getRevisionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const revision = await revisionService.getRevisionById(id);

    if (!revision) {
      return sendError(res, 'Revision not found', 404);
    }

    return sendSuccess(res, revision, 'Revision fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const restoreRevision = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'Unauthorized', 401);
    }

    const post = await revisionService.restoreRevision(id, userId);
    return sendSuccess(res, post, 'Revision restored successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
