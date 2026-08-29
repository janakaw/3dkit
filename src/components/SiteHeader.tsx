import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Facebook, Instagram, LogOut, Music2, Search, ShoppingCart, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { categories, categorySlug, setSubcategories } from "@/lib/products";
import { SubscribeModal, SUBSCRIBE_EVENT } from "@/components/SubscribeModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const open = () => setShowSubscribe(true);
    window.addEventListener(SUBSCRIBE_EVENT, open);

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setUserName(data.user?.user_metadata?.["display_name"] ?? data.user?.email?.split("@")[0] ?? null);
    };
    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserName(session?.user.user_metadata?.["display_name"] ?? session?.user.email?.split("@")[0] ?? null);
    });

    return () => {
      active = false;
      window.removeEventListener(SUBSCRIBE_EVENT, open);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserName(null);
    await navigate({ to: "/signin", replace: true });
  };

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
                <Link
                  to="/category/$category"
                  params={{ category: "set" }}
                  className="flex items-center gap-1 py-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Set
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </Link>
                <div className="invisible absolute left-0 top-full w-44 rounded-xl border border-border bg-card p-2 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
                  {setSubcategories.map((s) => (
                    <Link
                      key={s}
                      to="/category/$category"
                      params={{ category: "set" }}
                      search={{ sub: s }}
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
                to="/category/$category"
                params={{ category: categorySlug(c) }}
                className="py-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {c}
              </Link>
            ),
          )}
          <Link
            to="/midpoly"
            className="rounded-full border border-brand px-3 py-1 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
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
          <ThemeToggle />
          <Link to="/search" aria-label="Search models" className="text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Link to="/cart" aria-label="View cart" className="relative text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingCart className="h-5 w-5" aria-hidden />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
              3
            </span>
          </Link>
          {userName ? (
            <>
              <Link to="/my-models" className="hidden text-sm font-semibold text-brand transition-colors hover:text-foreground sm:block">
                My Models
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                title={`Sign out ${userName}`}
                className="hidden text-muted-foreground transition-colors hover:text-brand sm:block"
              >
                <LogOut className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign In
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowSubscribe(true)}
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
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
  const socials = [
    { icon: Youtube, label: "YouTube" },
    { icon: Instagram, label: "Instagram" },
    { icon: Facebook, label: "Facebook" },
    { icon: Music2, label: "TikTok" },
  ];
  return (
    <footer className="mt-20 border-t border-border py-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 px-5">
        <div className="flex items-center gap-4">
          {socials.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          ))}
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-base font-medium text-muted-foreground">
          <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          <Link to="/license" className="transition-colors hover:text-foreground">Standard License</Link>
          <Link to="/support" className="transition-colors hover:text-foreground">Support</Link>
          <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
          <Link to="/free" className="transition-colors hover:text-foreground">Free models</Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} 3Dkit — original furniture models by our studio, licensed for archviz, interior design and game development.
        </p>
      </div>
    </footer>
  );
}
