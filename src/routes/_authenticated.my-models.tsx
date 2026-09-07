import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { clearMedusaSession } from "@/lib/medusa/auth";
import { getProduct, type PolyTier, type Product } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/my-models")({
  head: () => ({
    meta: [
      { title: "My Models — Saved 3D Furniture | 3Dkit" },
      {
        name: "description",
        content: "View your saved 3Dkit furniture models and return to the assets you want to use.",
      },
      { property: "og:title", content: "My Models — 3Dkit" },
      { property: "og:description", content: "Your saved 3D furniture model library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyModelsPage,
});

type SavedModel = { slug: string; tier: string; created_at: string };

function MyModelsPage() {
  const [userName, setUserName] = useState("Your library");
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadSavedModels = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !authData.user) {
        setErrorMessage("Please sign in again to view your saved models.");
        setLoading(false);
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
        setErrorMessage("Your saved library could not be loaded right now.");
      } else {
        setUserName(
          profileResult.data?.display_name ??
            authData.user.user_metadata?.["display_name"] ??
            authData.user.email?.split("@")[0] ??
            "Your library",
        );
        setSavedModels(modelsResult.data ?? []);
      }
      setLoading(false);
    };

    void loadSavedModels();
    return () => {
      active = false;
    };
  }, []);

  const productsByTier = savedModels
    .map((saved) => {
      const product = getProduct(saved.slug);
      return product ? { product, tier: saved.tier === "mid" ? ("mid" as const) : ("high" as const) } : null;
    })
    .filter((item): item is { product: Product; tier: PolyTier } => item !== null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1400px] px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Member library</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
              {userName}'s models
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {savedModels.length} saved model{savedModels.length === 1 ? "" : "s"} for quick access.
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

        {loading && <p className="mt-12 text-sm text-muted-foreground">Loading your saved models…</p>}
        {!loading && errorMessage && <p className="mt-12 text-sm text-destructive">{errorMessage}</p>}
        {!loading && !errorMessage && productsByTier.length === 0 && (
          <div className="mt-12 max-w-xl border-t border-border pt-8">
            <Heart className="h-7 w-7 text-brand" aria-hidden />
            <h2 className="mt-4 font-display text-2xl font-bold uppercase text-foreground">Your library is empty</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Save any model with the heart icon and it will stay here under your account.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
            >
              Browse all models
            </Link>
          </div>
        )}
        {!loading && !errorMessage && productsByTier.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {productsByTier.map(({ product, tier }) => (
              <ProductCard key={`${product.slug}-${tier}`} product={product} tier={tier} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
