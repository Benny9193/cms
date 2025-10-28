import { prisma } from '../lib/prisma';

class RevisionService {
  async createRevision(
    postId: string,
    userId: string,
    data: { title: string; content: string; excerpt?: string }
  ) {
    return await prisma.postRevision.create({
      data: {
        postId,
        createdBy: userId,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getPostRevisions(postId: string) {
    return await prisma.postRevision.findMany({
      where: { postId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevisionById(id: string) {
    return await prisma.postRevision.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        post: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  async restoreRevision(revisionId: string, userId: string) {
    const revision = await this.getRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    // Create a new revision for current state before restoring
    const currentPost = await prisma.post.findUnique({
      where: { id: revision.postId },
    });

    if (currentPost) {
      await this.createRevision(revision.postId, userId, {
        title: currentPost.title,
        content: currentPost.content,
        excerpt: currentPost.excerpt || undefined,
      });
    }

    // Update post with revision data
    return await prisma.post.update({
      where: { id: revision.postId },
      data: {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
      },
    });
  }

  async deleteOldRevisions(postId: string, keepCount: number = 10) {
    const revisions = await prisma.postRevision.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (revisions.length > keepCount) {
      const toDelete = revisions.slice(keepCount).map((r) => r.id);
      await prisma.postRevision.deleteMany({
        where: {
          id: { in: toDelete },
        },
      });
    }
  }
}

export default new RevisionService();
