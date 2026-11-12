
export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly errors?: ApiFieldError[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    errors?: ApiFieldError[],
    isOperational = true,
  ) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    if (errors) {
      this.errors = errors;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
