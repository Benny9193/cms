import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        this.enabled = true;
        console.log('Redis cache enabled');
      } catch (error) {
        console.warn('Failed to connect to Redis:', error);
        this.enabled = false;
      }
    } else {
      console.log('Redis not configured, caching disabled');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.enabled || !this.redis) return;

    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Helper methods for common cache keys
  getPostKey(slug: string): string {
    return `post:${slug}`;
  }

  getPostsKey(page: number, limit: number): string {
    return `posts:page:${page}:limit:${limit}`;
  }

  getCategoryKey(slug: string): string {
    return `category:${slug}`;
  }

  getSearchKey(query: string, page: number): string {
    return `search:${query}:page:${page}`;
  }

  async invalidatePost(slug: string): Promise<void> {
    await this.del(this.getPostKey(slug));
    await this.delPattern('posts:*');
    await this.delPattern('search:*');
  }

  async invalidatePosts(): Promise<void> {
    await this.delPattern('posts:*');
    await this.delPattern('search:*');
  }

  async invalidateCategory(slug: string): Promise<void> {
    await this.del(this.getCategoryKey(slug));
    await this.delPattern('posts:*');
  }
}

export default new CacheService();
