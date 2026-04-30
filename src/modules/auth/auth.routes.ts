import { Router } from "express";
import { envConfig } from "../../config/env.config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/async-handler.util";
import { prisma } from "../../db/prisma";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

router.use(authRateLimiter);

const authService = new AuthService(
  prisma,
  envConfig.jwtAccessTokenSecret,
  envConfig.jwtRefreshTokenSecret,
  envConfig.accessTokenExpiresIn,
  envConfig.refreshTokenExpiresIn,
  envConfig.githubOauthBaseUrl,
  envConfig.githubClientId,
  envConfig.githubClientSecret,
  envConfig.githubRedirectUri,
);
const authController = new AuthController(authService);

router.get(
  "/github",
  asyncHandler(authController.githubAuth.bind(authController)),
);
router.get(
  "/github/callback",
  asyncHandler(authController.githubCallback.bind(authController)),
);
// CLI posts code + code_verifier + redirect_uri after capturing GitHub's redirect locally
router.post(
  "/github/token",
  asyncHandler(authController.githubCliToken.bind(authController)),
);
router.post(
  "/refresh",
  asyncHandler(authController.refresh.bind(authController)),
);
router.post(
  "/logout",
  asyncHandler(authController.logout.bind(authController)),
);

export default router;
