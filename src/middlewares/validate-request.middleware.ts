import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/app-error.util";

export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    const statusCode = first!.msg.toLowerCase().includes("unprocessable")
      ? 422
      : 400;
    return next(new AppError(first!.msg, statusCode));
  }

  next();
};
