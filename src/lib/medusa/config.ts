/**
 * Medusa Store API client.
 *
 * Ported from 3dchairstore-storefront/src/lib/config.ts. The client itself
 * is framework-agnostic — only the environment-variable access pattern
 * changes, matched here to how this project already reads Supabase's env
 * vars in src/integrations/supabase/client.ts (import.meta.env at build
 * time on the client, process.env as a fallback during SSR).
 */
import Medusa from "@medusajs/js-sdk";

function readEnv(key: string): string | undefined {
  return (import.meta.env?.[key] as string | undefined) ?? process.env[key];
}

const MEDUSA_BACKEND_URL = readEnv("VITE_MEDUSA_BACKEND_URL") ?? "http://localhost:9000";
const MEDUSA_PUBLISHABLE_KEY = readEnv("VITE_MEDUSA_PUBLISHABLE_KEY");

if (!MEDUSA_PUBLISHABLE_KEY) {
  // Non-fatal at import time (some routes may not need the SDK), but every
  // Store API call will fail without it, so surface it loudly.
  console.error(
    "[Medusa] Missing VITE_MEDUSA_PUBLISHABLE_KEY / MEDUSA_PUBLISHABLE_KEY env variable.",
  );
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env?.DEV ?? false,
  publishableKey: MEDUSA_PUBLISHABLE_KEY ?? "",
});
