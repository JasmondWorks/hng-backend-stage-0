import rateLimit from "express-rate-limit";
import { Request } from "express";

const tooManyRequests = {
  status: "error",
  message: "Too many requests, please try again later",
};

// For auth routes — 10 per minute, keyed by IP (no user identity yet)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// For all other API routes — 60 per minute, keyed by user ID.
// This middleware must run AFTER protect so that req.user is populated.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});
