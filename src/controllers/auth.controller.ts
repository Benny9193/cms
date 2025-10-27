import { Response } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        return sendError(res, 'Email, password, and name are required', 400);
      }

      if (password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long', 400);
      }

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendError(res, 'Invalid email format', 400);
      }

      const result = await authService.register({ email, password, name });

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      console.error('Register error:', error);
      return sendError(res, error.message || 'Registration failed', 400);
    }
  }

  async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
      }

      const result = await authService.login({ email, password });

      return sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      return sendError(res, error.message || 'Login failed', 401);
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }

      const user = await authService.getProfile(req.user.id);

      return sendSuccess(res, user, 'Profile retrieved successfully');
    } catch (error: any) {
      console.error('Get profile error:', error);
      return sendError(res, error.message || 'Failed to get profile', 400);
    }
  }
}

export default new AuthController();
