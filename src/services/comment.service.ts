import prisma from '../utils/db';
import { CreateCommentDto, UpdateCommentDto } from '../types';

export class CommentService {
  async createComment(data: CreateCommentDto, authorId: string) {
    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // If replying to a comment, verify parent exists
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.postId !== data.postId) {
        throw new Error('Parent comment does not belong to this post');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId,
        parentId: data.parentId,
        approved: false, // Comments require approval by default
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return comment;
  }

  async getCommentsByPost(
    postId: string,
    options: {
      page?: number;
      limit?: number;
      approved?: boolean;
    }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      postId,
      parentId: null, // Only top-level comments
    };

    if (options.approved !== undefined) {
      where.approved = options.approved;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
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
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommentById(id: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    return comment;
  }

  async updateComment(id: string, data: UpdateCommentDto, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Users can edit their own comments, admins can edit any comment
    if (comment.authorId !== userId && userRole !== 'admin') {
      throw new Error('You are not authorized to update this comment');
    }

    // Only admins can approve comments
    if (data.approved !== undefined && userRole !== 'admin') {
      throw new Error('Only admins can approve comments');
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: data.content,
        approved: data.approved,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async deleteComment(id: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Users can delete their own comments, admins can delete any comment
    if (comment.authorId !== userId && userRole !== 'admin') {
      throw new Error('You are not authorized to delete this comment');
    }

    await prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }

  async getAllComments(options: {
    page?: number;
    limit?: number;
    approved?: boolean;
    postId?: string;
    authorId?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.approved !== undefined) {
      where.approved = options.approved;
    }

    if (options.postId) {
      where.postId = options.postId;
    }

    if (options.authorId) {
      where.authorId = options.authorId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
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
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new CommentService();
