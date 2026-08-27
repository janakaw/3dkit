import { Link } from "@tanstack/react-router";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[0_14px_40px_-18px_oklch(0.2_0.02_80/0.45)]"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={`${product.name} 3D model preview`}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-base font-semibold leading-tight text-foreground">{product.name}</h3>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category}</p>
        <p className="pt-1 text-sm font-semibold text-foreground">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
