/**
 * Simple in-memory rate limiter for API routes.
 * Uses a Map with automatic cleanup to prevent memory leaks.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

/**
 * Check if request should be rate limited.
 * @param key - Unique identifier (e.g., IP address)
 * @param maxAttempts - Max attempts in the window
 * @param windowMs - Window duration in milliseconds
 * @returns Object with { limited, remaining, resetAt }
 */
export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Prevent unbounded growth
    if (store.size >= MAX_STORE_SIZE) {
      // Evict oldest half
      const keysToDelete: string[] = [];
      store.forEach((entry, key) => {
        if (entry.resetAt < now) keysToDelete.push(key);
      });
      if (keysToDelete.length === 0) {
        // If none are expired, just clear half randomly
        let count = 0;
        store.forEach((_, key) => {
          if (count++ < store.size / 2) store.delete(key);
        });
      } else {
        keysToDelete.forEach((k) => store.delete(k));
      }
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxAttempts - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return { limited: false, remaining: maxAttempts - entry.count, resetAt: entry.resetAt };
}
