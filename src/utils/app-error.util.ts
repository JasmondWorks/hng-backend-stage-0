export class AppError extends Error {
  public readonly statusCode: number;

  public readonly status: string; // "fail" (4xx) or "error" (5xx)

  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;

    // this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.status = "error";

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
