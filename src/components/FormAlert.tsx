import { AlertCircle, CheckCircle2 } from "lucide-react";

export type FormMessage = { tone: "error" | "success"; text: string };

/**
 * Inline form feedback. Errors are red with an icon and announced to screen
 * readers (`role="alert"`) so a failed sign-in is impossible to miss;
 * success/info notes use the normal text colour.
 */
export function FormAlert({
  message,
  className = "",
}: {
  message: FormMessage;
  className?: string;
}) {
  const isError = message.tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-destructive/40 bg-destructive/10 font-medium text-destructive"
          : "border-border bg-secondary text-foreground"
      } ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isError ? "" : "text-brand"}`} aria-hidden />
      <span>{message.text}</span>
    </div>
  );
}
