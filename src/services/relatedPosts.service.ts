import { prisma } from '../lib/prisma';

class RelatedPostsService {
  async getRelatedPosts(postId: string, limit: number = 5) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { categories: true, tags: true },
    });

    if (!post) return [];

    // Find posts with same categories or tags
    const related = await prisma.post.findMany({
      where: {
        AND: [
          { id: { not: postId } },
          { published: true },
          {
            OR: [
              {
                categories: {
                  some: {
                    id: { in: post.categories.map((c) => c.id) },
                  },
                },
              },
              {
                tags: {
                  some: {
                    id: { in: post.tags.map((t) => t.id) },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        categories: true,
        tags: true,
        _count: { select: { views: true, comments: true } },
      },
      take: limit * 2, // Get more to score
      orderBy: { createdAt: 'desc' },
    });

    // Score by relevance
    const scored = related.map((relatedPost) => {
      let score = 0;

      // Same category = +3 points per category
      const sharedCategories = relatedPost.categories.filter((c) =>
        post.categories.some((pc) => pc.id === c.id)
      );
      score += sharedCategories.length * 3;

      // Same tag = +1 point per tag
      const sharedTags = relatedPost.tags.filter((t) =>
        post.tags.some((pt) => pt.id === t.id)
      );
      score += sharedTags.length;

      // Bonus for recent posts
      const daysSincePublished = post.publishedAt
        ? Math.floor((Date.now() - post.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (daysSincePublished < 30) score += 1;

      return {
        ...relatedPost,
        score,
        viewCount: relatedPost._count.views,
        commentCount: relatedPost._count.comments,
      };
    });

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export default new RelatedPostsService();
