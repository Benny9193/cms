import prisma from '../utils/db';
import { CreateCategoryDto, UpdateCategoryDto } from '../types';
import { generateSlug, makeUniqueSlug } from '../utils/slug';

export class CategoryService {
  async createCategory(data: CreateCategoryDto) {
    // Generate slug from name
    const baseSlug = generateSlug(data.name);

    // Check for existing slugs
    const existingCategories = await prisma.category.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });

    const existingSlugs = existingCategories.map((c: { slug: string }) => c.slug);
    const uniqueSlug = makeUniqueSlug(baseSlug, existingSlugs);

    // Create the category
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: uniqueSlug,
        description: data.description,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return category;
  }

  async getAllCategories() {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return categories;
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async getCategoryWithPosts(
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

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const where: any = {
      categories: {
        some: {
          id: category.id,
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
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      category,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Handle slug update if name changed
    let slug = existingCategory.slug;
    if (data.name && data.name !== existingCategory.name) {
      const baseSlug = generateSlug(data.name);
      const existingCategories = await prisma.category.findMany({
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

      const existingSlugs = existingCategories.map((c: { slug: string }) => c.slug);
      slug = makeUniqueSlug(baseSlug, existingSlugs);
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return updatedCategory;
  }

  async deleteCategory(id: string) {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if category has posts
    if (existingCategory._count.posts > 0) {
      throw new Error(
        `Cannot delete category. It has ${existingCategory._count.posts} post(s) associated with it. Please remove the posts first.`
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}

export default new CategoryService();
