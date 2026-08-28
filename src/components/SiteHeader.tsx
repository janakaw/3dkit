import { Link } from "@tanstack/react-router";
import { ChevronDown, Search, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { categories, setSubcategories } from "@/lib/products";
import { SubscribeModal } from "@/components/SubscribeModal";

export function SiteHeader() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-6 px-5">
        <Link
          to="/"
          className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
        >
          3Dkit
        </Link>
        <nav className="hidden items-center gap-4 md:flex xl:gap-5">
          {categories.filter((c) => c !== "Side Table").map((c) =>
            c === "Set" ? (
              <div key={c} className="group relative">
                <button className="flex items-center gap-1 py-5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Set
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <div className="invisible absolute left-0 top-full w-44 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {setSubcategories.map((s) => (
                    <Link
                      key={s}
                      to="/"
                      search={{ category: "Set", sub: s }}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={c}
                to="/"
                search={{ category: c }}
                className="py-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {c}
              </Link>
            ),
          )}
          <Link
            to="/midpoly"
            className="rounded-full border border-primary px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Mid-Poly Furniture
          </Link>
          <Link
            to="/free"
            className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            FREE3D
          </Link>
          <Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </Link>
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
          <button
            onClick={() => setShowSubscribe(true)}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Join
          </button>
        </div>
      </div>
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border py-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-6 px-5 text-sm text-muted-foreground">
        <Link to="/about" className="hover:text-foreground">
          About
        </Link>
        <Link to="/free" className="hover:text-foreground">
          Free models
        </Link>
        <span>Terms</span>
        <span>Support</span>
        <span>Contact</span>
        <span>3Dkit Docs</span>
      </div>
    </footer>
  );
}
