import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart } from "lucide-react";

const categories = ["Armchair", "Sofa", "Coffee Table", "Cabinet", "Ottoman", "Set"];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          3Dkit
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {categories.map((c) => (
            <Link
              key={c}
              to="/"
              hash={c.toLowerCase().replace(" ", "-")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {c}
            </Link>
          ))}
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
            Free
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" aria-hidden />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              3
            </span>
          </div>
          <button className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
            Sign In
          </button>
          <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            Join
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border py-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-6 px-5 text-sm text-muted-foreground">
        <span>Terms</span>
        <span>Support</span>
        <span>Contact</span>
        <span>3Dkit Docs</span>
      </div>
    </footer>
  );
}
