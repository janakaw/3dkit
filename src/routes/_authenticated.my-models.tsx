import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Heart, LogOut, ShoppingBag } from "lucide-react";
import { DownloadMenu } from "@/components/DownloadMenu";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { clearMedusaSession } from "@/lib/medusa/auth";
import { libraryQueryOptions } from "@/lib/medusa/library-query";
import type { LibraryEntry } from "@/lib/medusa/library";
import { getProducts, type PolyTier, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/my-models")({
  head: () => ({
    meta: [
      { title: "My Models — Purchased & Saved 3D Furniture | 3Dkit" },
      {
        name: "description",
        content: "Your purchased 3Dkit models, ready to download, plus the ones you've saved.",
      },
      { property: "og:title", content: "My Models — 3Dkit" },
      { property: "og:description", content: "Your 3D furniture model library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  // The catalogue, so library entries (which carry a Medusa variant id and
  // product handle) and saved slugs can be rendered with the same
  // `ProductCard` the rest of the site uses. `_authenticated` is client
  // rendered, so this runs in the browser like the listing pages' loaders.
  loader: () => getProducts(),
  component: MyModelsPage,
});

type SavedModel = { slug: string; tier: string; created_at: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

function MyModelsPage() {
  const catalogue = Route.useLoaderData();
  const [userName, setUserName] = useState("Your library");
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState("");

  // Purchases (doc/bugs #6): the backend-derived library, newest first —
  // the same `["library"]` query the product pages use for owned state,
  // so this list and those buttons can never disagree. Always signed in
  // here (`_authenticated`), hence `true`.
  const libraryQuery = useQuery(libraryQueryOptions(true));

  useEffect(() => {
    let active = true;

    const loadSavedModels = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !authData.user) {
        setSavedError("Please sign in again to view your saved models.");
        setSavedLoading(false);
        return;
      }

      const [profileResult, modelsResult] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", authData.user.id).maybeSingle(),
        supabase
          .from("saved_models")
          .select("slug, tier, created_at")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!active) return;
      if (profileResult.error || modelsResult.error) {
        setSavedError("Your saved models could not be loaded right now.");
      } else {
        setUserName(
          profileResult.data?.display_name ??
            authData.user.user_metadata?.["display_name"] ??
            authData.user.email?.split("@")[0] ??
            "Your library",
        );
        setSavedModels(modelsResult.data ?? []);
      }
      setSavedLoading(false);
    };

    void loadSavedModels();
    return () => {
      active = false;
    };
  }, []);

  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
  const byVariant = new Map(
    catalogue.filter((p) => p.variantId).map((p) => [p.variantId as string, p]),
  );

  // A library entry resolves to a catalogue product by variant first (the
  // id that was actually bought), then by handle; a product that has since
  // been removed from the catalogue still shows from the line item's own
  // title/thumbnail so a purchase never silently disappears.
  const purchased = (libraryQuery.data ?? []).map((entry) => ({
    entry,
    product:
      (entry.variant_id ? byVariant.get(entry.variant_id) : undefined) ??
      (entry.product_handle ? bySlug.get(entry.product_handle) : undefined),
  }));

  const saved = savedModels
    .map((item) => {
      const product = bySlug.get(item.slug);
      return product
        ? { product, tier: item.tier === "mid" ? ("mid" as const) : ("high" as const) }
        : null;
    })
    .filter((item): item is { product: Product; tier: PolyTier } => item !== null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              Member library
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
              {userName}'s models
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {purchased.length} purchased · {saved.length} saved
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await clearMedusaSession().catch(() => undefined);
              await supabase.auth.signOut();
              window.location.href = "/signin";
            }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>

        {/* Purchased */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Purchased
          </h2>
          {libraryQuery.isPending && (
            <p className="mt-6 text-sm text-muted-foreground">Loading your purchases…</p>
          )}
          {libraryQuery.isError && (
            <p className="mt-6 text-sm text-destructive">
              Your purchases could not be loaded right now — please refresh.
            </p>
          )}
          {libraryQuery.isSuccess && purchased.length === 0 && (
            <div className="mt-6 max-w-xl border-t border-border pt-8">
              <h3 className="font-display text-2xl font-bold uppercase text-foreground">
                Nothing purchased yet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Models you buy appear here with their download links.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
              >
                Browse all models
              </Link>
            </div>
          )}
          {purchased.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {purchased.map(({ entry, product }) => (
                <li key={entry.line_item_id} className="flex flex-col gap-2">
                  {product ? (
                    <ProductCard product={product} />
                  ) : (
                    <UnlistedPurchaseCard entry={entry} />
                  )}
                  <p className="px-1 text-xs text-muted-foreground">
                    Purchased {formatDate(entry.purchased_at)}
                    {entry.order_display_id != null && <> · Order #{entry.order_display_id}</>}
                  </p>
                  <DownloadMenu lineItemId={entry.line_item_id} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Saved */}
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Heart className="h-4 w-4" aria-hidden />
            Saved
          </h2>
          {savedLoading && (
            <p className="mt-6 text-sm text-muted-foreground">Loading your saved models…</p>
          )}
          {!savedLoading && savedError && (
            <p className="mt-6 text-sm text-destructive">{savedError}</p>
          )}
          {!savedLoading && !savedError && saved.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Save any model with the heart icon and it will stay here under your account.
            </p>
          )}
          {!savedLoading && !savedError && saved.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {saved.map(({ product, tier }) => (
                <ProductCard key={`${product.slug}-${tier}`} product={product} tier={tier} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

/**
 * A purchase whose product is no longer in the catalogue (or not in the
 * first page of it). Rendered from what the order line item recorded so
 * the shopper still sees — and, once doc/bugs #8 lands, can download —
 * what they paid for.
 */
function UnlistedPurchaseCard({ entry }: { entry: LibraryEntry }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-square overflow-hidden bg-secondary">
        {entry.thumbnail && (
          <img
            src={entry.thumbnail}
            alt={`${entry.title} 3D model preview`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-base font-semibold leading-tight text-foreground">{entry.title}</h3>
        <p className="flex items-center gap-1 pt-1 text-sm font-semibold text-brand">
          <Download className="h-3.5 w-3.5" aria-hidden />
          In your library
        </p>
      </div>
    </article>
  );
}
