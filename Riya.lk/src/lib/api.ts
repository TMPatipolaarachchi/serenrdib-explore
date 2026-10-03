/**
 * Helpers for API route handlers: consistent JSON errors, body validation and
 * a wrapper that turns thrown errors into proper HTTP responses.
 *
 * Error response shape: { error: string, fieldErrors?: Record<string, string> }
 * (`error` and field messages are translation keys where it makes sense).
 */
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (message = "badRequest", fieldErrors?: Record<string, string>) =>
  new ApiError(400, message, fieldErrors);
export const unauthorized = (message = "unauthorized") => new ApiError(401, message);
export const forbidden = (message = "forbidden") => new ApiError(403, message);
export const notFound = (message = "notFound") => new ApiError(404, message);
export const tooManyRequests = (retryAfterSeconds: number, message = "tooManyRequests") =>
  new ApiError(429, message, undefined, { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) });

/** Flattens Zod issues into { "field.path": "firstMessage" }. */
export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Reads the JSON body and validates it; throws a 400 ApiError on failure. */
export async function parseBody<T>(req: Request, schema: ZodType<T>, extra?: Record<string, unknown>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("invalidJson");
  }
  if (extra && body && typeof body === "object") body = { ...body, ...extra };
  const result = schema.safeParse(body);
  if (!result.success) throw badRequest("validationFailed", zodFieldErrors(result.error));
  return result.data;
}

/**
 * Wraps a route handler so thrown ApiErrors become JSON responses and
 * unexpected errors are logged and returned as a generic 500.
 */
export function handler<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}) },
          { status: err.status, headers: err.headers },
        );
      }
      console.error("[api] Unhandled error:", err);
      return NextResponse.json({ error: "serverError" }, { status: 500 });
    }
  };
}

/** Best-effort client IP (behind Vercel/NGINX/Cloudflare). */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
