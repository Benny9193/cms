import { Response } from 'express';
import { AuthRequest } from '../types';
import userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.getAllUsers(page, limit);
    return sendSuccess(res, result, 'Users fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user, 'User fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    return sendSuccess(res, user, 'User updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user?.id) {
      return sendError(res, 'You cannot delete your own account', 400);
    }

    await userService.deleteUser(id);
    return sendSuccess(res, null, 'User deleted successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;

    const user = await userService.banUser(id, banned);
    return sendSuccess(res, user, `User ${banned ? 'banned' : 'unbanned'} successfully`);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Invalid role', 400);
    }

    const user = await userService.changeUserRole(id, role);
    return sendSuccess(res, user, 'User role updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return sendError(res, 'Search query is required', 400);
    }

    const users = await userService.searchUsers(query);
    return sendSuccess(res, users, 'Search completed');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await userService.getUserStats();
    return sendSuccess(res, stats, 'User stats fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
