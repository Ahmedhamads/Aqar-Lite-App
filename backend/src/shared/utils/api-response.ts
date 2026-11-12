
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function sendSuccess<T>(
  res: import("express").Response,
  data: T,
  message = "Request completed successfully",
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  } satisfies ApiResponse<T>);
}
