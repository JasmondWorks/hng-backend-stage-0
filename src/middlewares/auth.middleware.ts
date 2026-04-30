import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/app-error.util";
import { User, UserRoles } from "../modules/user/user.types";

// Augment the Express Request type so req.user is available in every
// route handler that sits behind the protect middleware, without casting.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// protect — verifies the Bearer JWT, loads the matching User row, and
// attaches it to req.user. Must run before restrictTo or any handler
// that needs to know who the caller is.
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Not logged in", 401));
  }

  const token = authHeader.split(" ")[1]!;

  let userId: string;
  try {
    const decoded = jwt.verify(token, envConfig.jwtAccessTokenSecret) as {
      sub: string;
    };
    userId = decoded.sub;
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return next(new AppError("User no longer exists", 401));
  if (!user.is_active) return next(new AppError("Account is inactive", 403));

  req.user = user;
  next();
};

// restrictTo — role guard. Always place after protect in the middleware
// chain, since it reads req.user that protect sets.
//
// Usage:
//   router.get("/admin-only", protect, restrictTo(UserRoles.admin), handler)
//   router.get("/any-role",   protect, restrictTo(UserRoles.admin, UserRoles.analyst), handler)
export const restrictTo = (...roles: UserRoles[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};
