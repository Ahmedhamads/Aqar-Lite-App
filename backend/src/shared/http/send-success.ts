
import type { Response } from "express";

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200,
): void {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
}
