import rateLimit from "express-rate-limit";
import { Request } from "express";

const tooManyRequests = {
  status: "error",
  message: "Too many requests, please try again later",
};

// Auth endpoints: 10 per minute, default IP-based key (IPv6-safe)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

// Authenticated API endpoints: 60 per minute, keyed by user ID.
// Runs after protect, so req.user is always populated — no IP fallback needed.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: Request) => req.user?.id ?? "anonymous",
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});
