import { Response } from "express";

export const sendSuccess = (
  res: Response,
  data: any,
  message?: string,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    status: "success",
    ...(message && { message }),
    ...(Array.isArray(data) && { count: data.length }),
    data,
  });
};
