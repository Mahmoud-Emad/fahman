/**
 * Utility for safely extracting error messages from unknown catch values
 */

/**
 * Extract a human-readable message from an unknown error value.
 * Use this in catch blocks instead of casting to `any` or `Error`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
