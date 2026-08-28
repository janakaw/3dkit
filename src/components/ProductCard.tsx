import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getVariant, type PolyTier, type Product } from "@/lib/products";

export function ProductCard({ product, tier = "high" }: { product: Product; tier?: PolyTier }) {
  const variant = getVariant(product, tier);
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleSaved = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        await navigate({ to: "/signin" });
        return;
      }

      if (saved) {
        const { error } = await supabase
          .from("saved_models")
          .delete()
          .eq("user_id", data.user.id)
          .eq("slug", product.slug)
          .eq("tier", tier);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase.from("saved_models").insert({
          user_id: data.user.id,
          slug: product.slug,
          tier,
        });
        if (error) throw error;
        setSaved(true);
      }
    } catch (error) {
      console.error("Could not update saved model", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[0_14px_40px_-18px_oklch(0.2_0.02_80/0.45)]">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        search={tier === "mid" ? { tier: "mid" as const } : {}}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={`${product.name} ${variant.label} 3D model preview`}
            loading="lazy"
            width={1024}
            height={1024}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] ${
              tier === "mid" ? "saturate-[0.75] contrast-[1.08]" : ""
            }`}
          />
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
            {variant.label}
          </span>
        </div>
        <div className="space-y-1 p-4">
          <h3 className="text-base font-semibold leading-tight text-foreground">{product.name}</h3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.subcategory ?? product.category} • {variant.polys}
          </p>
          <p className="pt-1 text-sm font-semibold text-foreground">{formatPrice(variant.price)}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={toggleSaved}
        disabled={saving}
        aria-label={saved ? `Remove ${product.name} from saved models` : `Save ${product.name}`}
        title={saved ? "Remove from My Models" : "Save to My Models"}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-60"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden />
      </button>
    </article>
  );
}
