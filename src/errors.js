// src/errors.js - Centralized error codes and structured error class
export const ERROR_CODE = Object.freeze({
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_MISSING: 'AUTH_MISSING',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_ARGS: 'INVALID_ARGS',
  API_ERROR: 'API_ERROR',
});

export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.isAppError = true;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
