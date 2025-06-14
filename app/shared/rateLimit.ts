import { APIError } from "encore.dev/api";
import { RateLimitEntry } from "./mongodb";
import log from "encore.dev/log";
import { Collection } from "mongodb";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5, message: "Too many login attempts. Please try again in 15 minutes." }, // 5 attempts per 15 minutes
  AUTH_REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3, message: "Too many registration attempts. Please try again in 1 hour." }, // 3 attempts per hour
  AUTH_REFRESH: { windowMs: 60 * 1000, maxRequests: 10, message: "Too many token refresh attempts. Please try again in 1 minute." }, // 10 attempts per minute
  DEFAULT: { windowMs: 15 * 60 * 1000, maxRequests: 100, message: "Rate limit exceeded. Please try again later." }, // 100 requests per 15 minutes
} as const;

const DISABLE_RATE_LIMITING = true;

/**
 * Check if request should be rate limited
 * @param rateLimitsCollection - MongoDB collection for rate limits
 * @param identifier - IP address or user ID
 * @param endpoint - API endpoint being accessed
 * @param config - Rate limit configuration
 * @returns Promise<void> - throws if rate limited
 */
export async function checkRateLimit(
  rateLimitsCollection: Collection<any>,
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.DEFAULT
): Promise<void> {
  // TEMPORARY: Skip rate limiting if disabled
  if (DISABLE_RATE_LIMITING) {
    return;
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Find existing rate limit entry
    const existingEntry = await rateLimitsCollection.findOne({
      identifier,
      endpoint,
      windowStart: { $gte: windowStart }
    });

    if (existingEntry) {
      if (existingEntry.requestCount >= config.maxRequests) {
        log.warn(`Rate limit exceeded for ${identifier} on ${endpoint}`, {
          identifier,
          endpoint,
          requestCount: existingEntry.requestCount,
          maxRequests: config.maxRequests
        });
        throw APIError.resourceExhausted(config.message || "Rate limit exceeded");
      }

      // Increment request count
      await rateLimitsCollection.updateOne(
        { _id: existingEntry._id },
        {
          $inc: { requestCount: 1 },
          $set: { lastRequest: now }
        }
      );
    } else {
      // Create new rate limit entry
      const newEntry: RateLimitEntry = {
        identifier,
        endpoint,
        requestCount: 1,
        windowStart: now,
        lastRequest: now
      };

      await rateLimitsCollection.insertOne(newEntry);
    }

    // Clean up old entries (optional, could be done via a cron job)
    await rateLimitsCollection.deleteMany({
      lastRequest: { $lt: new Date(now.getTime() - (config.windowMs * 2)) }
    });

  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    log.error(error, "Error checking rate limit");
    // Don't block requests if rate limiting fails
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(req: any, userID?: string): string {
  if (userID) {
    return `user:${userID}`;
  }

  // Try to get IP from various headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const ip = forwarded?.split(',')[0] || realIP || req.connection?.remoteAddress || 'unknown';

  return `ip:${ip}`;
}

/**
 * Reset rate limit for a specific identifier and endpoint
 */
export async function resetRateLimit(
  rateLimitsCollection: Collection<any>,
  identifier: string,
  endpoint: string
): Promise<void> {
  try {
    await rateLimitsCollection.deleteMany({ identifier, endpoint });
  } catch (error) {
    log.error(error, "Error resetting rate limit");
  }
}
