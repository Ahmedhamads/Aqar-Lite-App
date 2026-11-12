
import { ApiError } from "./errors";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

console.log("[API DEBUG] Base URL:", API_BASE_URL);
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  code?: string;
  details?: unknown;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  csrf?: boolean;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfRequest) {
    csrfRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result = (await response.json()) as ApiEnvelope<{
        csrfToken: string;
      }>;

      if (
        !response.ok ||
        !result.success ||
        !result.data?.csrfToken
      ) {
        throw new ApiError(
          response.status,
          "CSRF_TOKEN_FETCH_FAILED",
          result.message ?? "Unable to obtain CSRF token.",
        );
      }

      csrfToken = result.data.csrfToken;
      return csrfToken;
    })();
  }

  try {
    return await csrfRequest;
  } finally {
    csrfRequest = null;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        "HTTP_ERROR",
        `Request failed with status ${response.status}.`,
      );
    }

    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
    );
  }

  const result = (await response.json()) as
    | ApiEnvelope<T>
    | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    throw new ApiError(
      response.status,
      error.error?.code ?? error.code ?? "REQUEST_FAILED",
      error.error?.message ?? error.message ?? "Something went wrong.",
      error.error?.details ?? error.details,
    );
  }

  const envelope = result as ApiEnvelope<T>;

  if (!envelope.success) {
    throw new ApiError(
      response.status,
      "API_OPERATION_FAILED",
      envelope.message ?? "The operation could not be completed.",
    );
  }

  return envelope.data;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    csrf,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  const method = (fetchOptions.method ?? "GET").toUpperCase();

  const headers = new Headers(customHeaders);

  headers.set("Accept", "application/json");

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (csrf ?? !SAFE_METHODS.has(method)) {
    const token = await getCsrfToken();
    headers.set("X-CSRF-Token", token);
  }

  console.log("[API REQUEST]", {
  url: `${API_BASE_URL}${path}`,
  method,
});
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },

  post<T>(
    path: string,
    body?: unknown,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ): Promise<T> {
    return request<T>(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body,
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, {
      method: "DELETE",
    });
  },
};
