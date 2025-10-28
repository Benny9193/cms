import { prisma } from '../lib/prisma';
import imageService from './image.service';

interface CreateMediaDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  folder?: string;
  altText?: string;
  caption?: string;
}

class MediaService {
  async createMedia(userId: string, data: CreateMediaDto) {
    const media = await prisma.media.create({
      data: {
        ...data,
        uploadedBy: userId,
        folder: data.folder || 'root',
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // If it's an image, generate thumbnails
    if (data.mimetype.startsWith('image/')) {
      try {
        await imageService.generateThumbnail(data.path, data.filename);
      } catch (error) {
        console.error('Failed to generate thumbnails:', error);
      }
    }

    return media;
  }

  async getAllMedia(folder?: string, userId?: string) {
    return await prisma.media.findMany({
      where: {
        ...(folder && { folder }),
        ...(userId && { uploadedBy: userId }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMediaById(id: string) {
    return await prisma.media.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateMedia(
    id: string,
    data: { altText?: string; caption?: string; folder?: string }
  ) {
    return await prisma.media.update({
      where: { id },
      data,
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async deleteMedia(id: string) {
    const media = await this.getMediaById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    // Delete from database
    await prisma.media.delete({
      where: { id },
    });

    // TODO: Delete physical file from filesystem
    // This would require importing fs and handling file deletion

    return media;
  }

  async getFolders() {
    const folders = await prisma.media.findMany({
      select: { folder: true },
      distinct: ['folder'],
    });

    return folders.map((f) => f.folder).filter(Boolean);
  }

  async searchMedia(query: string) {
    return await prisma.media.findMany({
      where: {
        OR: [
          { originalName: { contains: query, mode: 'insensitive' } },
          { altText: { contains: query, mode: 'insensitive' } },
          { caption: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMediaStats(userId?: string) {
    const where = userId ? { uploadedBy: userId } : {};

    const [totalCount, totalSize, byType] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.aggregate({
        where,
        _sum: { size: true },
      }),
      prisma.media.groupBy({
        by: ['mimetype'],
        where,
        _count: true,
        _sum: { size: true },
      }),
    ]);

    return {
      totalFiles: totalCount,
      totalSize: totalSize._sum.size || 0,
      byType: byType.map((item) => ({
        mimetype: item.mimetype,
        count: item._count,
        size: item._sum.size || 0,
      })),
    };
  }
}

export default new MediaService();
