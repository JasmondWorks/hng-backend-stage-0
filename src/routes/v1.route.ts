import express, { Response, Router } from "express";

const router: Router = express.Router();

import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import classifyRoutes from "../modules/classify/classify.routes";
import profileRoutes from "../modules/profile/profile.routes";

router.get("/health", (_, res: Response) => {
  res.status(200).json({ ok: true, message: "HNG Backend API is running" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/classify", classifyRoutes);
router.use("/profiles", profileRoutes);

export default router;
