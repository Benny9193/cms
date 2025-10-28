import { prisma } from '../lib/prisma';
import fs from 'fs/promises';
import path from 'path';

class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  async ensureBackupDirectory(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async exportToJSON(models?: string[]): Promise<string> {
    await this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    const data: any = {};

    // Export selected models or all
    const modelsToExport = models || [
      'users',
      'posts',
      'categories',
      'tags',
      'comments',
      'postRevisions',
      'postViews',
      'media',
      'socialShares',
    ];

    if (modelsToExport.includes('users')) {
      data.users = await prisma.user.findMany({
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

    if (modelsToExport.includes('posts')) {
      data.posts = await prisma.post.findMany();
    }

    if (modelsToExport.includes('categories')) {
      data.categories = await prisma.category.findMany();
    }

    if (modelsToExport.includes('tags')) {
      data.tags = await prisma.tag.findMany();
    }

    if (modelsToExport.includes('comments')) {
      data.comments = await prisma.comment.findMany();
    }

    if (modelsToExport.includes('postRevisions')) {
      data.postRevisions = await prisma.postRevision.findMany();
    }

    if (modelsToExport.includes('postViews')) {
      data.postViews = await prisma.postView.findMany();
    }

    if (modelsToExport.includes('media')) {
      data.media = await prisma.media.findMany();
    }

    if (modelsToExport.includes('socialShares')) {
      data.socialShares = await prisma.socialShare.findMany();
    }

    data.exportedAt = new Date().toISOString();
    data.version = '1.0.0';

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    return filepath;
  }

  async exportPostsToCSV(): Promise<string> {
    await this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `posts-export-${timestamp}.csv`;
    const filepath = path.join(this.backupDir, filename);

    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });

    // CSV headers
    const headers = [
      'ID',
      'Title',
      'Slug',
      'Excerpt',
      'Published',
      'Published At',
      'Author Name',
      'Author Email',
      'Created At',
      'Updated At',
    ];

    // CSV rows
    const rows = posts.map((post) => [
      post.id,
      `"${post.title.replace(/"/g, '""')}"`,
      post.slug,
      post.excerpt ? `"${post.excerpt.replace(/"/g, '""')}"` : '',
      post.published,
      post.publishedAt ? post.publishedAt.toISOString() : '',
      post.author.name,
      post.author.email,
      post.createdAt.toISOString(),
      post.updatedAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    await fs.writeFile(filepath, csv);

    return filepath;
  }

  async importFromJSON(filepath: string): Promise<void> {
    const data = JSON.parse(await fs.readFile(filepath, 'utf-8'));

    // Import in order of dependencies
    if (data.users) {
      console.log(`Importing ${data.users.length} users...`);
      // Note: passwords would need to be handled separately
    }

    if (data.categories) {
      console.log(`Importing ${data.categories.length} categories...`);
      for (const category of data.categories) {
        await prisma.category.upsert({
          where: { id: category.id },
          update: category,
          create: category,
        });
      }
    }

    if (data.tags) {
      console.log(`Importing ${data.tags.length} tags...`);
      for (const tag of data.tags) {
        await prisma.tag.upsert({
          where: { id: tag.id },
          update: tag,
          create: tag,
        });
      }
    }

    if (data.posts) {
      console.log(`Importing ${data.posts.length} posts...`);
      for (const post of data.posts) {
        await prisma.post.upsert({
          where: { id: post.id },
          update: post,
          create: post,
        });
      }
    }

    console.log('Import completed');
  }

  async getBackupFiles(): Promise<string[]> {
    await this.ensureBackupDirectory();

    const files = await fs.readdir(this.backupDir);
    return files.filter((f) => f.endsWith('.json') || f.endsWith('.csv'));
  }

  async deleteBackup(filename: string): Promise<void> {
    const filepath = path.join(this.backupDir, filename);
    await fs.unlink(filepath);
  }
}

export default new BackupService();
