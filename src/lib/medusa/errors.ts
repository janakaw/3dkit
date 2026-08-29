/**
 * Error normalization for Medusa Store API calls.
 *
 * NOT a straight port of 3dchairstore-storefront/src/lib/util/medusa-error.ts
 * on purpose: that file assumes an Axios-style error shape (`error.response`,
 * `error.config`, `error.request`), but @medusajs/js-sdk's `Client` doesn't
 * use Axios — it throws its own `FetchError` (message/status/statusText)
 * from a native-fetch wrapper. The storefront's version still "works" only
 * by accident, always falling through to its final `else` branch. This
 * version matches what the SDK actually throws.
 */
import { FetchError } from "@medusajs/js-sdk";

export function medusaError(error: unknown): never {
  if (error instanceof FetchError) {
    const prefix = error.status
      ? `[${error.status}${error.statusText ? ` ${error.statusText}` : ""}] `
      : "";
    throw new Error(`${prefix}${error.message}`);
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(String(error));
}
