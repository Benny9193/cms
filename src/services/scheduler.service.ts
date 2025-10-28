import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import cacheService from './cache.service';

class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  init(): void {
    // Run every minute to check for scheduled posts
    this.scheduleTask(
      'publish-scheduled-posts',
      '* * * * *',
      this.publishScheduledPosts.bind(this)
    );

    // Clean up old post views every day at midnight
    this.scheduleTask(
      'cleanup-old-views',
      '0 0 * * *',
      this.cleanupOldViews.bind(this)
    );

    console.log('Scheduler service initialized');
  }

  scheduleTask(name: string, cronExpression: string, task: () => Promise<void>): void {
    if (this.tasks.has(name)) {
      console.warn(`Task ${name} already scheduled, skipping`);
      return;
    }

    const scheduledTask = cron.schedule(cronExpression, async () => {
      try {
        await task();
      } catch (error) {
        console.error(`Error in scheduled task ${name}:`, error);
      }
    });

    this.tasks.set(name, scheduledTask);
    console.log(`Scheduled task: ${name} (${cronExpression})`);
  }

  stopTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      console.log(`Stopped task: ${name}`);
    }
  }

  stopAll(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    this.tasks.clear();
  }

  private async publishScheduledPosts(): Promise<void> {
    const now = new Date();

    const scheduledPosts = await prisma.post.findMany({
      where: {
        published: false,
        scheduledPublishAt: {
          lte: now,
          not: null,
        },
      },
    });

    if (scheduledPosts.length === 0) return;

    console.log(`Publishing ${scheduledPosts.length} scheduled posts`);

    for (const post of scheduledPosts) {
      try {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            published: true,
            publishedAt: now,
            scheduledPublishAt: null,
          },
        });

        // Invalidate cache
        await cacheService.invalidatePost(post.slug);
        await cacheService.invalidatePosts();

        console.log(`Published scheduled post: ${post.title}`);
      } catch (error) {
        console.error(`Failed to publish post ${post.id}:`, error);
      }
    }
  }

  private async cleanupOldViews(): Promise<void> {
    // Keep views from last 90 days only
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    try {
      const deleted = await prisma.postView.deleteMany({
        where: {
          viewedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up ${deleted.count} old post views`);
    } catch (error) {
      console.error('Failed to cleanup old views:', error);
    }
  }
}

export default new SchedulerService();
