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
}

export default new PostService();
