import { Response } from 'express';
import categoryService from '../services/category.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class CategoryController {
  async createCategory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can create categories
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can create categories', 403);
      }

      const { name, description } = req.body;

      // Validation
      if (!name) {
        return sendError(res, 'Category name is required', 400);
      }

      if (name.length < 2) {
        return sendError(res, 'Category name must be at least 2 characters long', 400);
      }

      const category = await categoryService.createCategory({
        name,
        description,
      });

      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (error: any) {
      console.error('Create category error:', error);
      return sendError(res, error.message || 'Failed to create category', 400);
    }
  }

  async getAllCategories(_req: AuthRequest, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();

      return sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error: any) {
      console.error('Get categories error:', error);
      return sendError(res, error.message || 'Failed to retrieve categories', 400);
    }
  }

  async getCategoryById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const category = await categoryService.getCategoryById(id);

      return sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error: any) {
      console.error('Get category error:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve category', statusCode);
    }
  }

  async getCategoryBySlug(req: AuthRequest, res: Response) {
    try {
      const { slug } = req.params;

      const category = await categoryService.getCategoryBySlug(slug);

      return sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error: any) {
      console.error('Get category error:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve category', statusCode);
    }
  }

  async getCategoryWithPosts(req: AuthRequest, res: Response) {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const published = req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined;

      // Limit page size
      const maxLimit = 50;
      const finalLimit = Math.min(limit, maxLimit);

      const result = await categoryService.getCategoryWithPosts(slug, {
        page,
        limit: finalLimit,
        published,
      });

      return sendSuccess(res, result, 'Category with posts retrieved successfully');
    } catch (error: any) {
      console.error('Get category with posts error:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to retrieve category with posts', statusCode);
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can update categories
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can update categories', 403);
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Validation
      if (name && name.length < 2) {
        return sendError(res, 'Category name must be at least 2 characters long', 400);
      }

      const category = await categoryService.updateCategory(id, {
        name,
        description,
      });

      return sendSuccess(res, category, 'Category updated successfully');
    } catch (error: any) {
      console.error('Update category error:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to update category', statusCode);
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      // Only admins can delete categories
      if (req.user.role !== 'admin') {
        return sendError(res, 'Forbidden: Only admins can delete categories', 403);
      }

      const { id } = req.params;

      const result = await categoryService.deleteCategory(id);

      return sendSuccess(res, result, 'Category deleted successfully');
    } catch (error: any) {
      console.error('Delete category error:', error);
      const statusCode = error.message === 'Category not found' ? 404 : 400;
      return sendError(res, error.message || 'Failed to delete category', statusCode);
    }
  }
}

export default new CategoryController();
