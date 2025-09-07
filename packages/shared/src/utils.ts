/**
 * Shared utility functions for After Meet application
 */

/**
 * Extract meeting URL from calendar event description or location
 * Supports Zoom, Teams, and Google Meet URLs
 */
export function extractMeetingUrl(text: string): { url: string; platform: 'zoom' | 'teams' | 'meet' } | null {
  const patterns = {
    zoom: /https:\/\/([\w-]+\.)?zoom\.us\/j\/[\d\w?=&-]+/i,
    teams: /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[\w\d%=&?\/-]+/i,
    meet: /https:\/\/meet\.google\.com\/[\w-]+/i,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      return {
        url: match[0],
        platform: platform as 'zoom' | 'teams' | 'meet',
      };
    }
  }

  return null;
}

/**
 * Format meeting duration for display
 */
export function formatMeetingDuration(startTime: Date, endTime?: Date): string {
  if (!endTime) {
    return 'Duration unknown';
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  const minutes = Math.floor(durationMs / (1000 * 60));
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a slug from a string (for automation names, etc.)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format date for display in different contexts
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    time: { hour: '2-digit', minute: '2-digit' }
  };

  return new Intl.DateTimeFormat('en-US', formatOptions[format]).format(date);
}

/**
 * Calculate relative time (e.g., "2 hours ago", "in 30 minutes")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes === 0) {
    return 'now';
  }

  const future = diffMinutes > 0;
  const absDiffMinutes = Math.abs(diffMinutes);

  if (absDiffMinutes < 60) {
    return future 
      ? `in ${absDiffMinutes} minute${absDiffMinutes !== 1 ? 's' : ''}`
      : `${absDiffMinutes} minute${absDiffMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffHours = Math.round(absDiffMinutes / 60);
  if (diffHours < 24) {
    return future
      ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
      : `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return future
    ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Extract hashtags from social media content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#\w+/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()) : [];
}

/**
 * Generate a unique identifier (simple UUID v4 alternative)
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry utility for API calls
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}
