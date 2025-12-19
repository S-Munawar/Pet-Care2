import { Request, Response, NextFunction } from "express";

/**
 * Simple in-memory rate limiter for ML analysis requests
 * In production, use Redis or similar distributed cache
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const mlAnalysisRateLimit = (
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).dbUser?._id?.toString();
    
    if (!userId) {
      return next();
    }

    const key = `ml_analysis:${userId}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        message: "Too many analysis requests. Please try again later.",
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);
    
    next();
  };
};