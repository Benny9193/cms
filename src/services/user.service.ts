import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  banned?: boolean;
}

class UserService {
  async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map((user) => ({
        ...user,
        postCount: user._count.posts,
        commentCount: user._count.comments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            media: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      postCount: user._count.posts,
      commentCount: user._count.comments,
      mediaCount: user._count.media,
    };
  }

  async updateUser(id: string, data: UpdateUserDto) {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    // First, delete or reassign user's content
    // For now, we'll just delete the user (cascade will handle related data based on schema)
    return await prisma.user.delete({
      where: { id },
    });
  }

  async banUser(id: string, banned: boolean = true) {
    return await this.updateUser(id, { banned });
  }

  async changeUserRole(id: string, role: string) {
    if (!['user', 'admin'].includes(role)) {
      throw new Error('Invalid role');
    }

    return await this.updateUser(id, { role });
  }

  async changePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async searchUsers(query: string) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
      },
      take: 20,
    });
  }

  async getUserStats() {
    const [totalUsers, adminCount, bannedCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: last30Days } },
    });

    return {
      total: totalUsers,
      admins: adminCount,
      banned: bannedCount,
      newUsersLast30Days: newUsers,
    };
  }
}

export default new UserService();
