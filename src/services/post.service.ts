import prisma from '../utils/db';
import { CreatePostDto, UpdatePostDto } from '../types';
import { generateSlug, makeUniqueSlug } from '../utils/slug';

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

    // Create the post
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: uniqueSlug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        published: data.published || false,
        publishedAt: data.published ? new Date() : null,
        authorId,
        categories: data.categoryIds
          ? {
              connect: data.categoryIds.map((id) => ({ id })),
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
      },
    });

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
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  async getPostBySlug(slug: string) {
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
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
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

    // Handle publish status
    const publishedAt =
      data.published !== undefined
        ? data.published
          ? existingPost.publishedAt || new Date()
          : null
        : existingPost.publishedAt;

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        featuredImage: data.featuredImage,
        published: data.published,
        publishedAt,
        categories: data.categoryIds
          ? {
              set: data.categoryIds.map((catId) => ({ id: catId })),
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
      },
    });

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

    // Use PostgreSQL full-text search with ranking
    // The search_vector column uses weights: A (title), B (excerpt), C (content)
    // This provides relevance-based ranking

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
        },
      });

      // Sort posts by the original search rank
      const rankedPosts = postIds
        .map((id: string) => posts.find((p: any) => p.id === id))
        .filter(Boolean) as any[];

      return {
        posts: rankedPosts,
        query: searchQuery,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      // Fallback to basic search if PostgreSQL full-text search fails
      // This can happen if the search_vector column doesn't exist yet
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
          },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        posts,
        query: searchQuery,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  }
}

export default new PostService();
