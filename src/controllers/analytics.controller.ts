import { Response } from 'express';
import { AuthRequest } from '../types';
import analyticsService from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';

export const trackPostView = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    await analyticsService.trackPostView(postId, ipAddress, userAgent);
    return sendSuccess(res, null, 'View tracked');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getPostViewCount = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const count = await analyticsService.getPostViewCount(postId);
    return sendSuccess(res, { count }, 'View count fetched');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getMostViewedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await analyticsService.getMostViewedPosts(limit);
    return sendSuccess(res, posts, 'Most viewed posts fetched');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    return sendSuccess(res, stats, 'Dashboard stats fetched');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getViewTrend = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await analyticsService.getViewTrend(days);
    return sendSuccess(res, trend, 'View trend fetched');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const trackSocialShare = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { platform, shareUrl } = req.body;

    if (!platform) {
      return sendError(res, 'Platform is required', 400);
    }

    await analyticsService.trackSocialShare(postId, platform, shareUrl);
    return sendSuccess(res, null, 'Social share tracked');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};

export const getSocialShareStats = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const stats = await analyticsService.getSocialShareStats(postId);
    return sendSuccess(res, stats, 'Social share stats fetched');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
