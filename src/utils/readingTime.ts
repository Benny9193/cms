import readingTime from 'reading-time';

export const calculateReadingTime = (content: string): number => {
  const stats = readingTime(content);
  return Math.ceil(stats.minutes);
};
