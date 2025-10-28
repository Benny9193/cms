import { prisma } from '../lib/prisma';

class AnalyticsService {
  async trackPostView(postId: string, ipAddress?: string, userAgent?: string) {
    return await prisma.postView.create({
      data: {
        postId,
        ipAddress,
        userAgent,
      },
    });
  }

  async getPostViewCount(postId: string): Promise<number> {
    return await prisma.postView.count({
      where: { postId },
    });
  }

  async getPostViewsByDate(
    postId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.postView.findMany({
      where: {
        postId,
        viewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { viewedAt: 'desc' },
    });
  }

  async getMostViewedPosts(limit: number = 10) {
    const posts = await prisma.post.findMany({
      where: { published: true },
      include: {
        _count: {
          select: { views: true },
        },
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        views: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return posts.map((post) => ({
      ...post,
      viewCount: post._count.views,
    }));
  }

  async getDashboardStats() {
    const [totalPosts, totalViews, totalComments, totalUsers] = await Promise.all([
      prisma.post.count(),
      prisma.postView.count(),
      prisma.comment.count(),
      prisma.user.count(),
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [recentPosts, recentViews, recentComments] = await Promise.all([
      prisma.post.count({
        where: { createdAt: { gte: last30Days } },
      }),
      prisma.postView.count({
        where: { viewedAt: { gte: last30Days } },
      }),
      prisma.comment.count({
        where: { createdAt: { gte: last30Days } },
      }),
    ]);

    return {
      total: {
        posts: totalPosts,
        views: totalViews,
        comments: totalComments,
        users: totalUsers,
      },
      last30Days: {
        posts: recentPosts,
        views: recentViews,
        comments: recentComments,
      },
    };
  }

  async getViewTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const views = await prisma.postView.groupBy({
      by: ['viewedAt'],
      where: {
        viewedAt: { gte: startDate },
      },
      _count: true,
    });

    // Group by date
    const viewsByDate: Record<string, number> = {};
    views.forEach((view) => {
      const date = view.viewedAt.toISOString().split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + view._count;
    });

    return viewsByDate;
  }

  async trackSocialShare(postId: string, platform: string, shareUrl?: string) {
    return await prisma.socialShare.create({
      data: {
        postId,
        platform,
        shareUrl,
      },
    });
  }

  async getSocialShareStats(postId: string) {
    const shares = await prisma.socialShare.groupBy({
      by: ['platform'],
      where: { postId },
      _count: true,
    });

    return shares.map((share) => ({
      platform: share.platform,
      count: share._count,
    }));
  }
}

export default new AnalyticsService();
