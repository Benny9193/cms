export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract table of contents from HTML content
 * Extracts H2 and H3 headings
 */
export const generateTOC = (htmlContent: string): TOCItem[] => {
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, ''); // Strip HTML tags
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    toc.push({ id, text, level });
  }

  return toc;
};

/**
 * Add IDs to headings in HTML content
 * This allows anchors to work for navigation
 */
export const addHeadingIds = (htmlContent: string): string => {
  return htmlContent.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
    (match, level, attrs, text) => {
      // Check if ID already exists
      if (attrs.includes('id=')) {
        return match;
      }

      const cleanText = text.replace(/<[^>]*>/g, '');
      const id = cleanText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }
  );
};

/**
 * Generate reading time from HTML content
 * Average reading speed: 200 words per minute
 */
export const calculateReadingTime = (htmlContent: string): number => {
  const text = htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes);
};
