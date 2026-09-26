import { useMutation } from "@tanstack/react-query";
import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";
import { getDownloadLink } from "@/lib/medusa/library";
import { openSubscribe } from "@/components/SubscribeModal";
import { DOWNLOAD_FORMATS, type DownloadFormat } from "@/lib/medusa/download-formats";

/**
 * The "Download" dropdown for a model the shopper owns (doc/bugs #3, #7,
 * #8). `lineItemId` is the purchase (from the library entry); each format
 * asks the backend for a fresh link — the backend re-verifies ownership
 * and, once files are signed, the link is short-lived — then opens it.
 *
 * Pass `lineItemId={undefined}` for a model that is NOT owned. The menu
 * still opens and still lists every format, but picking one opens the
 * subscription modal instead of fetching a link.
 *
 * That is a commercial choice by the site owner, not a technical one (see
 * decisions doc, "Format click offers the subscription"): the one-off
 * purchase already has a dedicated path in Add to Cart directly above, so
 * the format click — the strongest intent signal on the page — is used to
 * steer toward the recurring plan. Change the target here, not the gating.
 *
 * This is presentation only. The backend re-checks ownership on every link
 * request and refuses anything unpaid, so an enabled button grants nothing.
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

  const requestFormat = (format: DownloadFormat) => {
    if (!owned) {
      // Not a failure — the visitor wants this file. Offer the way to get it.
      setOpen(false);
      openSubscribe();
      return;
    }
    link.mutate(format);
  };

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
        onClick={() => setOpen((o) => !o)}
        disabled={link.isPending}
        aria-expanded={open}
        title={owned ? undefined : "Choose a format to see your options"}
        className={`flex w-full items-center justify-between rounded-full border border-brand/50 bg-brand-soft font-semibold uppercase tracking-wide text-brand transition-colors hover:bg-brand hover:text-brand-foreground disabled:cursor-not-allowed disabled:opacity-60 ${size}`}
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
      {open && (
        <ul className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {DOWNLOAD_FORMATS.map((format) => (
            <li key={format.key}>
              <button
                type="button"
                onClick={() => requestFormat(format.key)}
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
