import { Response } from 'express';
import commentService from '../services/comment.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class CommentController {
  async createComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { content, postId, parentId } = req.body;

      // Validation
      if (!content || !postId) {
        return sendError(res, 'Content and postId are required', 400);
      }

      if (content.trim().length < 2) {
        return sendError(res, 'Comment must be at least 2 characters long', 400);
      }

      const comment = await commentService.createComment(
        {
          content,
          postId,
          parentId,
        },
        req.user.id
      );

      return sendSuccess(res, comment, 'Comment created successfully', 201);
    } catch (error: any) {
      console.error('Create comment error:', error);
      return sendError(res, error.message || 'Failed to create comment', 400);
    }
  }

  async getCommentsByPost(req: AuthRequest, res: Response) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const approved = req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined;

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await commentService.getCommentsByPost(postId, {
        page,
        limit: finalLimit,
        approved,
      });

      return sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error: any) {
      console.error('Get comments error:', error);
      return sendError(res, error.message || 'Failed to retrieve comments', 400);
    }
  }

  async getCommentById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const comment = await commentService.getCommentById(id);

      return sendSuccess(res, comment, 'Comment retrieved successfully');
    } catch (error: any) {
      console.error('Get comment error:', error);
      const statusCode = error.message === 'Comment not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve comment', statusCode);
    }
  }

  async getAllComments(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const approved = req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined;
      const postId = req.query.postId as string;
      const authorId = req.query.authorId as string;

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await commentService.getAllComments({
        page,
        limit: finalLimit,
        approved,
        postId,
        authorId,
      });

      return sendSuccess(res, result, 'Comments retrieved successfully');
    } catch (error: any) {
      console.error('Get all comments error:', error);
      return sendError(res, error.message || 'Failed to retrieve comments', 400);
    }
  }

  async updateComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const { content, approved } = req.body;

      // Validation
      if (content && content.trim().length < 2) {
        return sendError(res, 'Comment must be at least 2 characters long', 400);
      }

      const comment = await commentService.updateComment(
        id,
        {
          content,
          approved,
        },
        req.user.id,
        req.user.role
      );

      return sendSuccess(res, comment, 'Comment updated successfully');
    } catch (error: any) {
      console.error('Update comment error:', error);
      const statusCode = error.message === 'Comment not found' ? 404 : error.message.includes('not authorized') || error.message.includes('Only admins') ? 403 : 400;
      return sendError(res, error.message || 'Failed to update comment', statusCode);
    }
  }

  async deleteComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;

      const result = await commentService.deleteComment(id, req.user.id, req.user.role);

      return sendSuccess(res, result, 'Comment deleted successfully');
    } catch (error: any) {
      console.error('Delete comment error:', error);
      const statusCode = error.message === 'Comment not found' ? 404 : error.message.includes('not authorized') ? 403 : 400;
      return sendError(res, error.message || 'Failed to delete comment', statusCode);
    }
  }
}

export default new CommentController();
