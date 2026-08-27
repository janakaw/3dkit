import { Link } from "@tanstack/react-router";
import { formatPrice, getVariant, type PolyTier, type Product } from "@/lib/products";

export function ProductCard({ product, tier = "high" }: { product: Product; tier?: PolyTier }) {
  const variant = getVariant(product, tier);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[0_14px_40px_-18px_oklch(0.2_0.02_80/0.45)]"
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
  );
}
