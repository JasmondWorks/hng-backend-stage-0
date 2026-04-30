import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
} else {
  dotenv.config();
}

import express, { NextFunction, Request, Response } from "express";

import v1Routes from "./routes/v1.route";
import authRoutes from "./modules/auth/auth.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";

import { AppError } from "./utils/app-error.util";
import { envConfig } from "./config/env.config";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(requestLogger);
app.use(cors({ origin: "*" }));
app.use(cookieParser(envConfig.jwtAccessTokenSecret));

// Middleware to inject processed_at and attach it to all JSON responses
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const processed_at = new Date().toISOString(); // UTC ISO 8601
//   (req as unknown as Record<string, unknown>).processed_at = processed_at;

//   const originalJson = res.json;
//   res.json = function (body) {
//     if (res.statusCode >= 200 && res.statusCode < 400) {
//       if (body && typeof body === "object" && !Array.isArray(body)) {
//         if (
//           body.data &&
//           typeof body.data === "object" &&
//           !Array.isArray(body.data)
//         ) {
//           // Appends to the 'data' payload for successful wrapped responses
//           body.data.processed_at = processed_at;
//         } else {
//           // Fallback to top-level if no 'data' wrapper exists on success
//           body.processed_at = processed_at;
//         }
//       }
//     }
//     return originalJson.call(this, body);
//   };

//   next();
// });

app.use(express.json());

app.use("/api", v1Routes);
app.use("/auth", authRoutes);

app.get("/", (_, res: Response) => {
  res.status(200).json({ message: "Welcome to the HNG Backend API" });
});

// 404 catch-all

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler (must be last middleware)

app.use(globalErrorHandler);

export default app;
