import { Copy, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Factor } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { FormAlert, type FormMessage } from "@/components/FormAlert";
import { MfaCodeField } from "@/components/MfaCodeField";
import { friendlyAuthError } from "@/lib/auth-errors";
import { verifyMfaCode } from "@/lib/mfa";

type Enrollment = { factorId: string; qrCode: string; secret: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const primaryButton =
  "inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60";
const secondaryButton =
  "inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-60";

/**
 * Account → Settings → Two-step verification: set up an authenticator app
 * (TOTP), add a backup one, or turn it off. Turning a factor off asks for a
 * current code first, so a session left open on a shared computer can't
 * quietly disable it.
 */
export function TwoFactorSettings() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [copied, setCopied] = useState(false);

  const loadFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
      setFactors([]);
      return;
    }
    // Clear out set-ups that were started but never confirmed, so they don't
    // pile up against Supabase's per-user limit.
    await Promise.all(
      data.all
        .filter((f) => f.factor_type === "totp" && f.status === "unverified")
        .map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
    );
    setFactors(data.totp);
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const reset = () => {
    setCode("");
    setCopied(false);
  };

  const startEnrollment = async () => {
    setBusy(true);
    setMessage(null);
    reset();
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "3Dkit",
        // Must be unique per user; shown to the shopper only as "Authenticator app".
        friendlyName: `Authenticator ${Date.now()}`,
      });
      if (error) throw error;
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const cancelEnrollment = async () => {
    if (enrollment) await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    setEnrollment(null);
    reset();
  };

  const confirmEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollment) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollment.factorId,
        code,
      });
      if (error) throw error;
      const wasFirst = (factors?.length ?? 0) === 0;
      setEnrollment(null);
      reset();
      await loadFactors();
      setMessage({
        tone: "success",
        text: wasFirst
          ? "Two-step verification is on. You'll be asked for a code from your app each time you sign in."
          : "Backup authenticator added. A code from either app will work when you sign in.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!removingId) return;
    setBusy(true);
    setMessage(null);
    try {
      // Proves the person at the keyboard has an authenticator, and lifts the
      // session to aal2, which Supabase requires to remove a verified factor.
      await verifyMfaCode(code);
      const { error } = await supabase.auth.mfa.unenroll({ factorId: removingId });
      if (error) throw error;
      const remaining = (factors?.length ?? 1) - 1;
      setRemovingId(null);
      reset();
      await loadFactors();
      setMessage({
        tone: "success",
        text:
          remaining > 0
            ? "Authenticator removed. Two-step verification is still on with your other app."
            : "Two-step verification is off. You'll sign in with just your password.",
      });
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
    } catch {
      /* clipboard blocked — the key is still visible to copy by hand */
    }
  };

  const isOn = (factors?.length ?? 0) > 0;

  return (
    <section className="border-t border-border pt-8">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Two-step verification
        {factors !== null && (
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[10px] tracking-wide ${
              isOn ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"
            }`}
          >
            {isOn ? "On" : "Off"}
          </span>
        )}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Add a second step when you sign in: after your password, you'll enter a 6-digit code from an
        authenticator app such as Google Authenticator, Microsoft Authenticator or 1Password.
      </p>

      {factors === null && <p className="mt-5 text-sm text-muted-foreground">Loading…</p>}

      {/* Active authenticators */}
      {factors !== null && isOn && !enrollment && (
        <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
          {factors.map((factor, index) => (
            <li key={factor.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {index === 0 ? "Authenticator app" : `Backup authenticator ${index}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(factor.created_at)}
                    </p>
                  </div>
                </div>
                {removingId !== factor.id && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setRemovingId(factor.id);
                      setMessage(null);
                      reset();
                    }}
                    className="text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Remove
                  </button>
                )}
              </div>
              {removingId === factor.id && (
                <form className="mt-4 space-y-3" onSubmit={confirmRemoval}>
                  <MfaCodeField
                    id={`remove-code-${factor.id}`}
                    label="Enter a current code to confirm"
                    value={code}
                    onChange={setCode}
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={busy || code.length !== 6}
                      className="inline-flex rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {busy ? "Removing…" : "Remove authenticator"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRemovingId(null);
                        reset();
                      }}
                      className={secondaryButton}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Set-up: scan, then confirm with a code */}
      {enrollment && (
        <form
          className="mt-5 space-y-5 rounded-xl border border-border p-5"
          onSubmit={confirmEnrollment}
        >
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open your authenticator app and add a new account.</li>
            <li>Scan this QR code, or enter the setup key by hand.</li>
            <li>Type the 6-digit code the app shows to finish.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-5">
            {/* White backing so the code scans in dark mode too. */}
            <img
              src={enrollment.qrCode}
              alt="QR code for your authenticator app"
              width={176}
              height={176}
              className="rounded-lg bg-white p-2"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Setup key
              </p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {enrollment.secret.match(/.{1,4}/g)?.join(" ")}
              </p>
              <button
                type="button"
                onClick={() => void copySecret()}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          </div>
          <MfaCodeField id="enroll-code" value={code} onChange={setCode} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || code.length !== 6} className={primaryButton}>
              {busy ? "Checking…" : "Verify and turn on"}
            </button>
            <button
              type="button"
              onClick={() => void cancelEnrollment()}
              className={secondaryButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {factors !== null && !enrollment && !removingId && (
        <div className="mt-5">
          {isOn ? (
            <button
              type="button"
              onClick={() => void startEnrollment()}
              disabled={busy}
              className={secondaryButton}
            >
              Add a backup authenticator
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startEnrollment()}
              disabled={busy}
              className={primaryButton}
            >
              {busy ? "Starting…" : "Set up authenticator app"}
            </button>
          )}
        </div>
      )}

      {message && <FormAlert message={message} className="mt-5" />}

      {isOn && (
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Lost access to your app? A backup authenticator (for example on a second device) keeps you
          from being locked out. Otherwise, contact support and we&apos;ll help you back in after
          confirming it&apos;s you.
        </p>
      )}
    </section>
  );
}
