import { Response } from 'express';
import tagService from '../services/tag.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class TagController {
  async createTag(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can create tags
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can create tags', 403);
      }

      const { name } = req.body;

      // Validation
      if (!name) {
        return sendError(res, 'Tag name is required', 400);
      }

      if (name.length < 2) {
        return sendError(res, 'Tag name must be at least 2 characters long', 400);
      }

      const tag = await tagService.createTag({ name });

      return sendSuccess(res, tag, 'Tag created successfully', 201);
    } catch (error: any) {
      console.error('Create tag error:', error);
      return sendError(res, error.message || 'Failed to create tag', 400);
    }
  }

  async getAllTags(_req: AuthRequest, res: Response) {
    try {
      const tags = await tagService.getAllTags();

      return sendSuccess(res, tags, 'Tags retrieved successfully');
    } catch (error: any) {
      console.error('Get tags error:', error);
      return sendError(res, error.message || 'Failed to retrieve tags', 400);
    }
  }

  async getTagById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const tag = await tagService.getTagById(id);

      return sendSuccess(res, tag, 'Tag retrieved successfully');
    } catch (error: any) {
      console.error('Get tag error:', error);
      const statusCode = error.message === 'Tag not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve tag', statusCode);
    }
  }

  async getTagBySlug(req: AuthRequest, res: Response) {
    try {
      const { slug } = req.params;

      const tag = await tagService.getTagBySlug(slug);

      return sendSuccess(res, tag, 'Tag retrieved successfully');
    } catch (error: any) {
      console.error('Get tag error:', error);
      const statusCode = error.message === 'Tag not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve tag', statusCode);
    }
  }

  async getTagWithPosts(req: AuthRequest, res: Response) {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await tagService.getTagWithPosts(slug, {
        page,
        limit: finalLimit,
        published,
      });

      return sendSuccess(res, result, 'Tag with posts retrieved successfully');
    } catch (error: any) {
      console.error('Get tag with posts error:', error);
      const statusCode = error.message === 'Tag not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve tag with posts', statusCode);
    }
  }

  async updateTag(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can update tags
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can update tags', 403);
      }

      const { id } = req.params;
      const { name } = req.body;

      // Validation
      if (name && name.length < 2) {
        return sendError(res, 'Tag name must be at least 2 characters long', 400);
      }

      const tag = await tagService.updateTag(id, { name });

      return sendSuccess(res, tag, 'Tag updated successfully');
    } catch (error: any) {
      console.error('Update tag error:', error);
      const statusCode = error.message === 'Tag not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to update tag', statusCode);
    }
  }

  async deleteTag(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can delete tags
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can delete tags', 403);
      }

      const { id } = req.params;

      const result = await tagService.deleteTag(id);

      return sendSuccess(res, result, 'Tag deleted successfully');
    } catch (error: any) {
      console.error('Delete tag error:', error);
      const statusCode = error.message === 'Tag not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to delete tag', statusCode);
    }
  }
}

export default new TagController();
