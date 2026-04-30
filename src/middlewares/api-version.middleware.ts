import { Request, Response, NextFunction } from "express";

export const requireApiVersion = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.headers["x-api-version"] !== "1") {
    res
      .status(400)
      .json({ status: "error", message: "API version header required" });
    return;
  }
  next();
};
