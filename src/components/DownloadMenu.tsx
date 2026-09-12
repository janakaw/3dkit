import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";
import { getDownloadLink } from "@/lib/medusa/library";
import { DOWNLOAD_FORMATS, type DownloadFormat } from "@/lib/medusa/download-formats";

/**
 * The "Download" dropdown for a model the shopper owns (doc/bugs #3, #7,
 * #8). `lineItemId` is the purchase (from the library entry); each format
 * asks the backend for a fresh link — the backend re-verifies ownership
 * and, once files are signed, the link is short-lived — then opens it.
 *
 * Pass `lineItemId={undefined}` for a model that is NOT owned: the button
 * renders disabled with "Purchase to download". That state is purely a
 * convenience; the backend refuses a download for anything unpaid.
 */
export function DownloadMenu({
  lineItemId,
  compact = false,
}: {
  lineItemId: string | undefined;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owned = Boolean(lineItemId);

  const link = useMutation({
    mutationFn: (format: DownloadFormat) =>
      getDownloadLink({ data: { lineItemId: lineItemId as string, format } }),
    onSuccess: ({ url }) => {
      setError(null);
      setOpen(false);
      window.open(url, "_blank", "noopener");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Couldn't prepare the download.");
    },
  });

  const size = compact ? "px-4 py-2.5 text-xs" : "px-6 py-3.5 text-sm";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => owned && setOpen((o) => !o)}
        disabled={!owned || link.isPending}
        aria-expanded={open}
        title={owned ? undefined : "Purchase this model to download it"}
        className={`flex w-full items-center justify-between rounded-full border border-brand/50 bg-brand-soft font-semibold uppercase tracking-wide text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground disabled:hover:bg-transparent ${size}`}
      >
        <span className="flex items-center gap-2">
          <Download className="h-4 w-4" aria-hidden />
          {link.isPending ? "Preparing…" : owned ? "Download" : "Purchase to download"}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && owned && (
        <ul className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {DOWNLOAD_FORMATS.map((format) => (
            <li key={format.key}>
              <button
                type="button"
                onClick={() => link.mutate(format.key)}
                className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors last:border-0 hover:bg-secondary hover:text-foreground"
              >
                <span>{format.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
