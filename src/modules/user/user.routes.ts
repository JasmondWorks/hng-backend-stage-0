import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.util";
import { protect, restrictTo } from "../../middlewares/auth.middleware";
import { apiRateLimiter } from "../../middlewares/rate-limit.middleware";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserRoles } from "./user.types";

const router = Router();

const controller = new UserController(new UserService());

// All user routes require a valid JWT
router.use(protect);
router.use(apiRateLimiter);

// Any authenticated user
router.get("/me", asyncHandler(controller.getMe.bind(controller)));

// Admin only
router.get(
  "/",
  restrictTo(UserRoles.admin),
  asyncHandler(controller.getAllUsers.bind(controller)),
);
router.patch(
  "/:id/role",
  restrictTo(UserRoles.admin),
  asyncHandler(controller.updateUserRole.bind(controller)),
);

export default router;
