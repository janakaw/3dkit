/** 6-digit authenticator code input, shared by sign-in, settings and password reset. */
export function MfaCodeField({
  id,
  value,
  onChange,
  label = "6-digit code",
  autoFocus = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus={autoFocus}
        placeholder="______"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-foreground outline-none focus:border-brand"
      />
    </div>
  );
}
