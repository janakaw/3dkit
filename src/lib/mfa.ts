/**
 * Two-step verification (TOTP authenticator apps) on top of Supabase Auth MFA.
 *
 * A password sign-in gives a session at `aal1`; a shopper who has turned on
 * two-step verification must then enter a 6-digit code to reach `aal2`.
 * `needsMfaCode()` is the one check the sign-in page, the account-page
 * guard and the reset-password page all use.
 */
import { supabase } from "@/integrations/supabase/client";

/** Signed in with a password but still owes a code (has a verified factor, session is aal1). */
export async function needsMfaCode(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

/**
 * Verify a code against the shopper's authenticator(s). Someone with a
 * backup authenticator could be using either app, so each verified TOTP
 * factor is tried until one accepts the code.
 */
export async function verifyMfaCode(code: string): Promise<void> {
  const clean = code.replace(/\s+/g, "");
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const factors = data.totp;
  if (factors.length === 0) throw new Error("No authenticator app is set up on this account.");
  let lastError: unknown = null;
  for (const factor of factors) {
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: clean,
    });
    if (!verifyError) return;
    lastError = verifyError;
  }
  throw lastError;
}
