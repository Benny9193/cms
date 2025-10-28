import prisma from '../utils/db';
import { CreatePostDto, UpdatePostDto } from '../types';
import { generateSlug, makeUniqueSlug } from '../utils/slug';
import { sanitizePostContent, sanitizePlainText } from '../utils/sanitize';
import { calculateReadingTime } from '../utils/readingTime';
import revisionService from './revision.service';
import cacheService from './cache.service';

export class PostService {
  async createPost(data: CreatePostDto, authorId: string) {
    // Generate slug from title
    const baseSlug = generateSlug(data.title);

    // Check for existing slugs
    const existingPosts = await prisma.post.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });

    const existingSlugs = existingPosts.map((p: { slug: string }) => p.slug);
    const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);

    // Sanitize content
    const sanitizedContent = sanitizePostContent(data.content);
    const sanitizedExcerpt = data.excerpt ? sanitizePlainText(data.excerpt) : undefined;

    // Calculate reading time
    const readingTime = calculateReadingTime(sanitizedContent);

    // Handle scheduled publishing
    const isPublished = data.published || false;
    const scheduledPublishAt = data.scheduledPublishAt ? new Date(data.scheduledPublishAt) : null;
    const publishedAt = isPublished && !scheduledPublishAt ? new Date() : null;

    // Create the post
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: uniqueSlug,
        content: sanitizedContent,
        excerpt: sanitizedExcerpt,
        featuredImage: data.featuredImage,
        published: scheduledPublishAt ? false : isPublished,
        publishedAt,
        scheduledPublishAt,
        readingTime,

        // SEO fields
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImage: data.ogImage,

        authorId,
        categories: data.categoryIds
          ? {
              connect: data.categoryIds.map((id) => ({ id })),
            }
          : undefined,
        tags: data.tagIds
          ? {
              connect: data.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
      },
    });

    // Create initial revision
    await revisionService.createRevision(post.id, authorId, {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || undefined,
    });

    // Invalidate cache
    await cacheService.invalidatePosts();

    return post;
  }

  async getAllPosts(options: {
    page?: number;
    limit?: number;
    published?: boolean;
    authorId?: string;
    categoryId?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Try cache first
    const cacheKey = cacheService.getPostsKey(page, limit);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const where: any = {};

    if (options.published !== undefined) {
      where.published = options.published;
    }

    if (options.authorId) {
      where.authorId = options.authorId;
    }

    if (options.categoryId) {
      where.categories = {
        some: {
          id: options.categoryId,
        },
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          categories: true,
          tags: true,
          _count: {
            select: {
              views: true,
              comments: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const result = {
      posts: posts.map((post) => ({
        ...post,
        viewCount: post._count.views,
        commentCount: post._count.comments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  async getPostById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
        _count: {
          select: {
            views: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return {
      ...post,
      viewCount: post._count.views,
      commentCount: post._count.comments,
    };
  }

  async getPostBySlug(slug: string) {
    // Try cache first
    const cacheKey = cacheService.getPostKey(slug);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
        _count: {
          select: {
            views: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const result = {
      ...post,
      viewCount: post._count.views,
      commentCount: post._count.comments,
    };

    // Cache for 10 minutes
    await cacheService.set(cacheKey, result, 600);

    return result;
  }

  async updatePost(id: string, data: UpdatePostDto, userId: string, userRole: string) {
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    // Check authorization (only author or admin can update)
    if (existingPost.authorId !== userId && userRole !== 'admin') {
      throw new Error('You are not authorized to update this post');
    }

    // Create revision before updating
    await revisionService.createRevision(id, userId, {
      title: existingPost.title,
      content: existingPost.content,
      excerpt: existingPost.excerpt || undefined,
    });

    // Handle slug update if title changed
    let slug = existingPost.slug;
    if (data.title && data.title !== existingPost.title) {
      const baseSlug = generateSlug(data.title);
      const existingPosts = await prisma.post.findMany({
        where: {
          slug: {
            startsWith: baseSlug,
          },
          id: {
            not: id,
          },
        },
        select: { slug: true },
      });

      const existingSlugs = existingPosts.map((p: { slug: string }) => p.slug);
      slug = makeUniqueSlug(baseSlug, existingSlugs);
    }

    // Sanitize content if provided
    const sanitizedContent = data.content ? sanitizePostContent(data.content) : undefined;
    const sanitizedExcerpt = data.excerpt ? sanitizePlainText(data.excerpt) : undefined;

    // Calculate reading time if content changed
    const readingTime = sanitizedContent ? calculateReadingTime(sanitizedContent) : undefined;

    // Handle publish status
    let publishedAt = existingPost.publishedAt;
    let scheduledPublishAt = existingPost.scheduledPublishAt;

    if (data.scheduledPublishAt) {
      scheduledPublishAt = new Date(data.scheduledPublishAt);
      publishedAt = null;
    } else if (data.published !== undefined) {
      if (data.published && !existingPost.published) {
        publishedAt = new Date();
        scheduledPublishAt = null;
      } else if (!data.published) {
        publishedAt = null;
      }
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title, slug }),
        ...(sanitizedContent && { content: sanitizedContent }),
        ...(sanitizedExcerpt !== undefined && { excerpt: sanitizedExcerpt }),
        ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage }),
        ...(data.published !== undefined && { published: data.published }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(scheduledPublishAt !== undefined && { scheduledPublishAt }),
        ...(readingTime && { readingTime }),

        // SEO fields
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.ogTitle !== undefined && { ogTitle: data.ogTitle }),
        ...(data.ogDescription !== undefined && { ogDescription: data.ogDescription }),
        ...(data.ogImage !== undefined && { ogImage: data.ogImage }),

        categories: data.categoryIds
          ? {
              set: data.categoryIds.map((catId) => ({ id: catId })),
            }
          : undefined,
        tags: data.tagIds
          ? {
              set: data.tagIds.map((tagId) => ({ id: tagId })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
      },
    });

    // Invalidate cache
    await cacheService.invalidatePost(existingPost.slug);
    await cacheService.invalidatePost(updatedPost.slug);
    await cacheService.invalidatePosts();

    return updatedPost;
  }

  async deletePost(id: string, userId: string, userRole: string) {
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new Error('Post not found');
    }

    // Check authorization (only author or admin can delete)
    if (existingPost.authorId !== userId && userRole !== 'admin') {
      throw new Error('You are not authorized to delete this post');
    }

    await prisma.post.delete({
      where: { id },
    });

    // Invalidate cache
    await cacheService.invalidatePost(existingPost.slug);
    await cacheService.invalidatePosts();

    return { message: 'Post deleted successfully' };
  }

  async searchPosts(options: {
    query: string;
    page?: number;
    limit?: number;
    published?: boolean;
    authorId?: string;
    categoryId?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    if (!options.query || options.query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const searchQuery = options.query.trim();

    // Try cache first
    const cacheKey = cacheService.getSearchKey(searchQuery, page);
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Build filter conditions
    const filters: string[] = [];
    const params: any[] = [searchQuery];
    let paramIndex = 1;

    if (options.published !== undefined) {
      paramIndex++;
      filters.push(`p.published = $${paramIndex}`);
      params.push(options.published);
    }

    if (options.authorId) {
      paramIndex++;
      filters.push(`p."authorId" = $${paramIndex}`);
      params.push(options.authorId);
    }

    if (options.categoryId) {
      paramIndex++;
      filters.push(`EXISTS (
        SELECT 1 FROM "_CategoryToPost" cp
        WHERE cp."B" = p.id AND cp."A" = $${paramIndex}
      )`);
      params.push(options.categoryId);
    }

    const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

    // Add pagination params
    params.push(limit, skip);
    const limitParam = paramIndex + 1;
    const offsetParam = paramIndex + 2;

    // PostgreSQL full-text search query with ranking
    const searchSQL = `
      SELECT
        p.*,
        ts_rank(p.search_vector, websearch_to_tsquery('english', $1)) as rank
      FROM "Post" p
      WHERE p.search_vector @@ websearch_to_tsquery('english', $1)
        ${whereClause}
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countSQL = `
      SELECT COUNT(*) as count
      FROM "Post" p
      WHERE p.search_vector @@ websearch_to_tsquery('english', $1)
        ${whereClause}
    `;

    try {
      // Execute search query
      const [searchResults, countResults] = await Promise.all([
        prisma.$queryRawUnsafe(searchSQL, ...params) as Promise<any[]>,
        prisma.$queryRawUnsafe(countSQL, ...params.slice(0, -2)) as Promise<any[]>,
      ]);

      const total = parseInt(countResults[0]?.count || '0');

      // Fetch full post data with relations for the found posts
      const postIds = searchResults.map((r: any) => r.id);

      if (postIds.length === 0) {
        return {
          posts: [],
          query: searchQuery,
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const posts = await prisma.post.findMany({
        where: {
          id: {
            in: postIds,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          categories: true,
          tags: true,
          _count: {
            select: {
              views: true,
              comments: true,
            },
          },
        },
      });

      // Sort posts by the original search rank
      const rankedPosts = postIds
        .map((id: string) => posts.find((p: any) => p.id === id))
        .filter(Boolean) as any[];

      const result = {
        posts: rankedPosts.map((post) => ({
          ...post,
          viewCount: post._count.views,
          commentCount: post._count.comments,
        })),
        query: searchQuery,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return result;
    } catch (error: any) {
      // Fallback to basic search if PostgreSQL full-text search fails
      console.warn('PostgreSQL full-text search failed, falling back to basic search:', error.message);

      const where: any = {
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            excerpt: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        ],
      };

      if (options.published !== undefined) {
        where.published = options.published;
      }

      if (options.authorId) {
        where.authorId = options.authorId;
      }

      if (options.categoryId) {
        where.categories = {
          some: {
            id: options.categoryId,
          },
        };
      }

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            categories: true,
            tags: true,
            _count: {
              select: {
                views: true,
                comments: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ]);

      const result = {
        posts: posts.map((post) => ({
          ...post,
          viewCount: post._count.views,
          commentCount: post._count.comments,
        })),
        query: searchQuery,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return result;
    }
  }

  async bulkDelete(postIds: string[], userId: string, userRole: string) {
    // Verify user can delete all posts
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, authorId: true, slug: true },
    });

    if (userRole !== 'admin') {
      const unauthorized = posts.find((post) => post.authorId !== userId);
      if (unauthorized) {
        throw new Error('You are not authorized to delete some of these posts');
      }
    }

    await prisma.post.deleteMany({
      where: { id: { in: postIds } },
    });

    // Invalidate cache
    for (const post of posts) {
      await cacheService.invalidatePost(post.slug);
    }
    await cacheService.invalidatePosts();

    return { message: `${posts.length} posts deleted successfully` };
  }

  async duplicatePost(id: string, userId: string) {
    const originalPost = await this.getPostById(id);

    // Create new post with "Copy of" prefix
    return await this.createPost(
      {
        title: `Copy of ${originalPost.title}`,
        content: originalPost.content,
        excerpt: originalPost.excerpt || undefined,
        featuredImage: originalPost.featuredImage || undefined,
        published: false,
        categoryIds: originalPost.categories.map((c) => c.id),
        tagIds: originalPost.tags.map((t) => t.id),
        metaTitle: originalPost.metaTitle || undefined,
        metaDescription: originalPost.metaDescription || undefined,
        ogTitle: originalPost.ogTitle || undefined,
        ogDescription: originalPost.ogDescription || undefined,
        ogImage: originalPost.ogImage || undefined,
      },
      userId
    );
  }
}

export default new PostService();
