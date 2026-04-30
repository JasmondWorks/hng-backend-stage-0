import { Router } from "express";
import { envConfig } from "../../config/env.config";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { protect, restrictTo } from "../../middlewares/auth.middleware";
import { ClassifyController } from "./classify.controller";
import { ClassifyService } from "./classify.service";
import { classifyNameValidator } from "./classify.validators";
import { asyncHandler } from "../../utils/async-handler.util";
import { UserRoles } from "../user/user.types";

const router: Router = Router();

const classifyService = new ClassifyService(envConfig.genderizeApiUrl);
const classifyController = new ClassifyController(classifyService);

// classify is read-only — both roles can use it
router.get(
  "/",
  protect,
  restrictTo(UserRoles.admin, UserRoles.analyst),
  classifyNameValidator,
  validateRequest,
  asyncHandler(classifyController.classifyName.bind(classifyController)),
);

export default router;
