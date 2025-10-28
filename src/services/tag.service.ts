import prisma from '../utils/db';
import { CreateTagDto, UpdateTagDto } from '../types';
import { generateSlug, makeUniqueSlug } from '../utils/slug';

export class TagService {
  async createTag(data: CreateTagDto) {
    // Generate slug from name
    const baseSlug = generateSlug(data.name);

    // Check for existing slugs
    const existingTags = await prisma.tag.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });

    const existingSlugs = existingTags.map((t: { slug: string }) => t.slug);
    const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug: uniqueSlug,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return tag;
  }

  async getAllTags() {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return tags;
  }

  async getTagById(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  }

  async getTagBySlug(slug: string) {
    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  }

  async getTagWithPosts(
    slug: string,
    options: {
      page?: number;
      limit?: number;
      published?: boolean;
    }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    const where: any = {
      tags: {
        some: {
          id: tag.id,
        },
      },
    };

    if (options.published !== undefined) {
      where.published = options.published;
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
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      tag,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTag(id: string, data: UpdateTagDto) {
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new Error('Tag not found');
    }

    // Handle slug update if name changed
    let slug = existingTag.slug;
    if (data.name && data.name !== existingTag.name) {
      const baseSlug = generateSlug(data.name);
      const existingTags = await prisma.tag.findMany({
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

      const existingSlugs = existingTags.map((t: { slug: string }) => t.slug);
      slug = makeUniqueSlug(baseSlug, existingSlugs);
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name,
        slug,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return updatedTag;
  }

  async deleteTag(id: string) {
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!existingTag) {
      throw new Error('Tag not found');
    }

    // Unlike categories, we allow deleting tags even if they have posts
    // The tag will just be removed from those posts
    await prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }
}

export default new TagService();
