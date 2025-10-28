import { Response } from 'express';
import postService from '../services/post.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class PostController {
  async createPost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { title, content, excerpt, featuredImage, published, categoryIds, tagIds } = req.body;

      // Validation
      if (!title || !content) {
        return sendError(res, 'Title and content are required', 400);
      }

      if (title.length < 3) {
        return sendError(res, 'Title must be at least 3 characters long', 400);
      }

      const post = await postService.createPost(
        {
          title,
          content,
          excerpt,
          featuredImage,
          published,
          categoryIds,
          tagIds,
        },
        req.user.id
      );

      return sendSuccess(res, post, 'Post created successfully', 201);
    } catch (error: any) {
      console.error('Create post error:', error);
      return sendError(res, error.message || 'Failed to create post', 400);
    }
  }

  async getAllPosts(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
      const authorId = req.query.authorId as string;
      const categoryId = req.query.categoryId as string;

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await postService.getAllPosts({
        page,
        limit: finalLimit,
        published,
        authorId,
        categoryId,
      });

      return sendSuccess(res, result, 'Posts retrieved successfully');
    } catch (error: any) {
      console.error('Get posts error:', error);
      return sendError(res, error.message || 'Failed to retrieve posts', 400);
    }
  }

  async getPostById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const post = await postService.getPostById(id);

      return sendSuccess(res, post, 'Post retrieved successfully');
    } catch (error: any) {
      console.error('Get post error:', error);
      const statusCode = error.message === 'Post not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve post', statusCode);
    }
  }

  async getPostBySlug(req: AuthRequest, res: Response) {
    try {
      const { slug } = req.params;

      const post = await postService.getPostBySlug(slug);

      return sendSuccess(res, post, 'Post retrieved successfully');
    } catch (error: any) {
      console.error('Get post error:', error);
      const statusCode = error.message === 'Post not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve post', statusCode);
    }
  }

  async updatePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;
      const { title, content, excerpt, featuredImage, published, categoryIds, tagIds } = req.body;

      // Validation
      if (title && title.length < 3) {
        return sendError(res, 'Title must be at least 3 characters long', 400);
      }

      const post = await postService.updatePost(
        id,
        {
          title,
          content,
          excerpt,
          featuredImage,
          published,
          categoryIds,
          tagIds,
        },
        req.user.id,
        req.user.role
      );

      return sendSuccess(res, post, 'Post updated successfully');
    } catch (error: any) {
      console.error('Update post error:', error);
      const statusCode = error.message === 'Post not found' ? 404 : error.message.includes('not authorized') ? 403 : 400;
      return sendError(res, error.message || 'Failed to update post', statusCode);
    }
  }

  async deletePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const { id } = req.params;

      const result = await postService.deletePost(id, req.user.id, req.user.role);

      return sendSuccess(res, result, 'Post deleted successfully');
    } catch (error: any) {
      console.error('Delete post error:', error);
      const statusCode = error.message === 'Post not found' ? 404 : error.message.includes('not authorized') ? 403 : 400;
      return sendError(res, error.message || 'Failed to delete post', statusCode);
    }
  }

  async searchPosts(req: AuthRequest, res: Response) {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;
      const authorId = req.query.authorId as string;
      const categoryId = req.query.categoryId as string;

      // Validation
      if (!query) {
        return sendError(res, 'Search query parameter (q) is required', 400);
      }

      if (query.trim().length < 2) {
        return sendError(res, 'Search query must be at least 2 characters long', 400);
      }

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await postService.searchPosts({
        query,
        page,
        limit: finalLimit,
        published,
        authorId,
        categoryId,
      });

      return sendSuccess(res, result, 'Search completed successfully');
    } catch (error: any) {
      console.error('Search posts error:', error);
      return sendError(res, error.message || 'Failed to search posts', 400);
    }
  }
}

export default new PostController();
