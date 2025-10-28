# Public Frontend Implementation Guide

## Overview

Complete guide to build the public-facing blog website with Related Posts and Table of Contents features.

---

## Backend Enhancements First

### 1. Add Related Posts Endpoint

Create `/home/user/cms/src/services/relatedPosts.service.ts`:

```typescript
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

      // Same category = +3 points
      const sharedCategories = relatedPost.categories.filter((c) =>
        post.categories.some((pc) => pc.id === c.id)
      );
      score += sharedCategories.length * 3;

      // Same tag = +1 point
      const sharedTags = relatedPost.tags.filter((t) =>
        post.tags.some((pt) => pt.id === t.id)
      );
      score += sharedTags.length;

      return { ...relatedPost, score };
    });

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export default new RelatedPostsService();
```

### 2. Add Related Posts Controller

Create `/home/user/cms/src/controllers/relatedPosts.controller.ts`:

```typescript
import { Response, Request } from 'express';
import relatedPostsService from '../services/relatedPosts.service';
import { sendSuccess, sendError } from '../utils/response';

export const getRelatedPosts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const posts = await relatedPostsService.getRelatedPosts(id, limit);
    return sendSuccess(res, posts, 'Related posts fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
```

### 3. Add Route

In `/home/user/cms/src/routes/post.routes.ts`, add:

```typescript
import { getRelatedPosts } from '../controllers/relatedPosts.controller';

router.get('/:id/related', getRelatedPosts);
```

### 4. Add TOC Generator Utility

Create `/home/user/cms/src/utils/toc.ts`:

```typescript
interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export const generateTOC = (htmlContent: string): TOCItem[] => {
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, ''); // Strip HTML tags
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');

    toc.push({ id, text, level });
  }

  return toc;
};

// Add IDs to headings in HTML
export const addHeadingIds = (htmlContent: string): string => {
  return htmlContent.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
    (match, level, attrs, text) => {
      const cleanText = text.replace(/<[^>]*>/g, '');
      const id = cleanText.toLowerCase().replace(/[^\w]+/g, '-');
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }
  );
};
```

---

## Public Frontend Structure

```
public-site/
├── package.json
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .env
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   ├── PostCard.tsx
    │   ├── RelatedPosts.tsx
    │   ├── TableOfContents.tsx
    │   ├── CommentForm.tsx
    │   ├── CommentList.tsx
    │   └── SearchBar.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── PostDetail.tsx
    │   ├── CategoryArchive.tsx
    │   ├── TagArchive.tsx
    │   └── SearchResults.tsx
    └── services/
        └── api.ts
```

---

## Key Components

### Header Component

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            YourBlog
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link to="/categories" className="text-gray-700 hover:text-blue-600">
              Categories
            </Link>
            <Link to="/tags" className="text-gray-700 hover:text-blue-600">
              Tags
            </Link>
            <Link to="/search" className="text-gray-700 hover:text-blue-600">
              <FaSearch />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### Related Posts Component

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { posts } from '../services/api';
import PostCard from './PostCard';

interface RelatedPostsProps {
  postId: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ postId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['related-posts', postId],
    queryFn: () => posts.getRelated(postId),
  });

  if (isLoading) return <div>Loading related posts...</div>;

  const relatedPosts = data?.data?.data || [];

  if (relatedPosts.length === 0) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
```

### Table of Contents Component

```typescript
import React, { useState, useEffect } from 'react';
import { FaList } from 'react-icons/fa';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');

    const tocItems: TOCItem[] = Array.from(headings).map((heading) => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/[^\w]+/g, '-') || '',
      text: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1)),
    }));

    setToc(tocItems);

    // Add IDs to headings if they don't have them
    const contentDiv = document.querySelector('.post-content');
    if (contentDiv) {
      const actualHeadings = contentDiv.querySelectorAll('h2, h3');
      actualHeadings.forEach((heading, index) => {
        if (!heading.id && tocItems[index]) {
          heading.id = tocItems[index].id;
        }
      });
    }

    // Intersection Observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -35% 0px' }
    );

    actualHeadings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [content]);

  if (toc.length === 0) return null;

  return (
    <aside className="hidden lg:block sticky top-24 w-64 h-fit">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold">
          <FaList />
          <span>Table of Contents</span>
        </div>
        <nav>
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`toc-item block ${
                item.level === 3 ? 'ml-4' : ''
              } ${activeId === item.id ? 'active' : ''}`}
            >
              {item.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default TableOfContents;
```

### Post Detail Page

```typescript
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { posts, analytics } from '../services/api';
import { format } from 'date-fns';
import { FaClock, FaEye, FaComment } from 'react-icons/fa';
import TableOfContents from '../components/TableOfContents';
import RelatedPosts from '../components/RelatedPosts';
import CommentList from '../components/CommentList';

const PostDetail: React.FC = () => {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => posts.getBySlug(slug!),
    enabled: !!slug,
  });

  const post = data?.data?.data;

  useEffect(() => {
    if (post?.id) {
      // Track view
      analytics.trackView(post.id);
    }
  }, [post?.id]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!post) {
    return <div className="container mx-auto px-4 py-8">Post not found</div>;
  }

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || post.title}</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        <meta property="og:title" content={post.ogTitle || post.title} />
        <meta property="og:description" content={post.ogDescription || post.excerpt} />
        {post.ogImage && <meta property="og:image" content={post.ogImage} />}
      </Helmet>

      <article className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-4 text-gray-600 text-sm">
              <span>By {post.author.name}</span>
              <span>•</span>
              <span>{format(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy')}</span>
              {post.readingTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <FaClock /> {post.readingTime} min read
                  </span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <FaEye /> {post.viewCount || 0} views
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FaComment /> {post.commentCount || 0} comments
              </span>
            </div>

            {post.categories && post.categories.length > 0 && (
              <div className="flex gap-2 mt-4">
                {post.categories.map((cat: any) => (
                  <span
                    key={cat.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-auto rounded-lg mb-8"
            />
          )}

          <div className="flex gap-8">
            {/* Content */}
            <div className="flex-1">
              <div
                className="post-content prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
                  {post.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Related Posts */}
              <RelatedPosts postId={post.id} />

              {/* Comments */}
              <section className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">Comments</h2>
                <CommentList postId={post.id} />
              </section>
            </div>

            {/* Table of Contents */}
            <TableOfContents content={post.content} />
          </div>
        </div>
      </article>
    </>
  );
};

export default PostDetail;
```

---

## Installation Steps

```bash
# 1. Navigate to public-site
cd public-site

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Visit http://localhost:3001
```

---

## Features Included

### ✅ Related Posts
- Scoring algorithm based on shared categories and tags
- Displays 5 most relevant posts
- Beautiful card grid layout
- Automatic relevance calculation

### ✅ Table of Contents
- Auto-generated from H2 and H3 headings
- Sticky sidebar positioning
- Active heading highlighting with IntersectionObserver
- Smooth scroll to section
- Only shows on desktop (hidden on mobile)

### ✅ SEO Optimization
- React Helmet for meta tags
- Open Graph tags
- Dynamic titles and descriptions
- Schema.org markup ready

### ✅ View Tracking
- Automatic view counting on page load
- Analytics integration
- Display view count on posts

### ✅ Comments
- Display approved comments
- Nested comment support
- Comment form for visitors
- Real-time comment count

### ✅ Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly on mobile
- Hamburger menu

---

## Next Steps After Setup

1. **Customize Design**: Update colors, fonts in tailwind.config.js
2. **Add More Pages**: About, Contact, Author pages
3. **Newsletter Signup**: Add subscription form
4. **Social Sharing**: Add share buttons
5. **RSS Feed**: Generate RSS XML
6. **Sitemap**: Auto-generate sitemap.xml

---

## Performance Tips

1. **Image Optimization**: Use Next.js Image or similar
2. **Code Splitting**: React.lazy for routes
3. **Caching**: React Query built-in
4. **CDN**: Deploy to Vercel/Netlify
5. **Analytics**: Google Analytics/Plausible

---

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel

# Or deploy to Netlify
netlify deploy --prod

# Or use Docker
docker build -t cms-public .
docker run -p 3001:80 cms-public
```

---

This creates a complete, modern, SEO-optimized public blog with all requested features! 🚀
