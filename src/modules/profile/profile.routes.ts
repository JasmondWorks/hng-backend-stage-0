import { Router } from "express";
import { envConfig } from "../../config/env.config";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { protect, restrictTo } from "../../middlewares/auth.middleware";
import { requireApiVersion } from "../../middlewares/api-version.middleware";
import { apiRateLimiter } from "../../middlewares/rate-limit.middleware";
import { ProfileRepository } from "./profile.repository";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { createProfileValidator } from "./profile.validators";
import { asyncHandler } from "../../utils/async-handler.util";
import { UserRoles } from "../user/user.types";

const router: Router = Router();

const profileRepo = new ProfileRepository();
const profileService = new ProfileService(
  envConfig.genderizeApiUrl,
  envConfig.agifyApiUrl,
  envConfig.nationalizeApiUrl,
  profileRepo,
);
const profileController = new ProfileController(profileService);

// All profile routes: authenticate → rate limit (user-keyed) → version check
router.use(protect);
router.use(apiRateLimiter);
router.use(requireApiVersion);

// analyst + admin: read
router.get(
  "/",
  restrictTo(UserRoles.admin, UserRoles.analyst),
  asyncHandler(profileController.getAllProfiles.bind(profileController)),
);
router.get(
  "/search",
  restrictTo(UserRoles.admin, UserRoles.analyst),
  asyncHandler(
    profileController.getProfilesBySearchQuery.bind(profileController),
  ),
);
router.get(
  "/export",
  restrictTo(UserRoles.admin, UserRoles.analyst),
  asyncHandler(profileController.exportProfiles.bind(profileController)),
);
router.get(
  "/:id",
  restrictTo(UserRoles.admin, UserRoles.analyst),
  asyncHandler(profileController.getProfileById.bind(profileController)),
);

// admin only: write
router.post(
  "/",
  restrictTo(UserRoles.admin),
  createProfileValidator,
  validateRequest,
  asyncHandler(profileController.createProfile.bind(profileController)),
);
router.delete(
  "/:id",
  restrictTo(UserRoles.admin),
  asyncHandler(profileController.deleteProfile.bind(profileController)),
);

export default router;
