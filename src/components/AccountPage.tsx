import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

/**
 * Shared shell for the account pages reached from the header's Account
 * menu (Payments, Settings) — same frame and heading style as My Models.
 */
export function AccountPage({
  eyebrow = "Account",
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Empty-state block matching My Models' "Nothing purchased yet". */
export function AccountEmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-12 max-w-xl border-t border-border pt-8">
      <h3 className="font-display text-2xl font-bold uppercase text-foreground">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
