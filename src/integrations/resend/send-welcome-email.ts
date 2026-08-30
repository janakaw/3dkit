/**
 * Client-safe entry point for the post-confirmation welcome email — see
 * cart.ts's header comment for why this thin `createServerFn()` wrapper
 * layer exists at all (client.server.ts reads `process.env`, which makes
 * it server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import * as resendServer from "./client.server";

type WelcomeEmailInput = {
  email: string;
  displayName?: string | null | undefined;
};

export const sendWelcomeEmail = createServerFn({ method: "POST", strict: { output: false } })
  .validator((data: WelcomeEmailInput) => data)
  .handler(({ data }): Promise<void> => resendServer.sendWelcomeEmail(data));
