/**
 * Plain-English versions of the Supabase Auth errors shoppers actually hit.
 * Falls back to Supabase's own message for anything unrecognised.
 */
export function friendlyAuthError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  switch (code) {
    case "invalid_credentials":
      return "Incorrect email or password. Please try again.";
    case "email_not_confirmed":
      return "Please confirm your email first — check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too weak — please choose a longer or less common one.";
    case "same_password":
      return "Your new password must be different from your current one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "mfa_verification_failed":
    case "mfa_verification_rejected":
      return "That code isn't right. Check your authenticator app and try the current code.";
    case "mfa_challenge_expired":
      return "That code has expired. Please enter the current code from your app.";
    case "insufficient_aal":
      return "Please enter a code from your authenticator app to continue.";
    case "too_many_enrolled_mfa_factors":
      return "You've reached the maximum number of authenticator apps. Remove one before adding another.";
    case "mfa_totp_enroll_not_enabled":
    case "mfa_totp_verify_not_enabled":
      return "Two-step verification isn't available right now. Please try again later.";
    case "validation_failed":
      return "Please check the email address and try again.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "We could not complete that request. Please try again.";
}
