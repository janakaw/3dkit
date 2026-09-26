import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Facebook,
  Instagram,
  Library,
  LogOut,
  Music2,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  UserRound,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { categories, categorySlug, setSubcategories } from "@/lib/products";
import { SubscribeModal, SUBSCRIBE_EVENT } from "@/components/SubscribeModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { clearMedusaSession } from "@/lib/medusa/auth";
import { cartQueryOptions } from "@/lib/medusa/cart-query";
import { LIBRARY_QUERY_KEY } from "@/lib/medusa/library-query";
import { ORDERS_QUERY_KEY } from "@/lib/medusa/orders-query";

export function SiteHeader() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  // Single shared cart cache (see cart-query.ts) — every add/remove writes
  // its result straight into this same query, so the badge picks it up on
  // its next render with no fetch of its own. If this is the first
  // cart-aware component to mount on a given page, TanStack Query fetches
  // once here; if the cart page (or another instance of the header) is
  // already mounted and has fetched, this just reads the shared cache.
  const { data: cart } = useQuery(cartQueryOptions());
  const queryClient = useQueryClient();
  const cartCount = cart?.items?.length ?? 0;

  useEffect(() => {
    let active = true;
    const open = () => setShowSubscribe(true);
    window.addEventListener(SUBSCRIBE_EVENT, open);

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (active)
        setUserName(
          data.user?.user_metadata?.["display_name"] ?? data.user?.email?.split("@")[0] ?? null,
        );
    };
    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserName(
        session?.user.user_metadata?.["display_name"] ?? session?.user.email?.split("@")[0] ?? null,
      );
    });

    return () => {
      active = false;
      window.removeEventListener(SUBSCRIBE_EVENT, open);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Forget the Medusa customer session along with Supabase's — otherwise
    // the next person on this browser would inherit the customer cookie.
    await clearMedusaSession().catch(() => undefined);
    await supabase.auth.signOut();
    // The library is per-person — don't let the next sign-in on this
    // browser see a cached copy of the previous shopper's purchases.
    queryClient.removeQueries({ queryKey: LIBRARY_QUERY_KEY });
    queryClient.removeQueries({ queryKey: ORDERS_QUERY_KEY });
    setUserName(null);
    // Back to the storefront, signed out (the account pages would only
    // bounce to sign-in anyway).
    await navigate({ to: "/", replace: true });
  };

  // Sign-up collects a single display name ("Alex Morgan"), so the greeting
  // uses its first word; without one, `userName` is already the email prefix.
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

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
          {categories
            .filter((c) => c !== "Side Table")
            .map((c) =>
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
            // The nav is too crowded for this label on one line at any width (it
            // wraps even at 1440px), so it's always two lines: `w-min` sizes the pill
            // to the longer word instead of the width the flex row would give it.
            className="w-min rounded-full border border-brand px-3 py-1 text-center text-sm font-semibold leading-tight text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
          >
            Mid-Poly Furniture
          </Link>
          <Link
            to="/free"
            className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            FREE3D
          </Link>
          <Link
            to="/about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/search"
            aria-label="Search models"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            to="/cart"
            aria-label="View cart"
            className="relative text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          {userName ? (
            <AccountMenu firstName={firstName} onSignOut={signOut} />
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign In
              </Link>
              <Link
                to="/signin"
                search={{ mode: "signup" }}
                className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </header>
  );
}

// Amazon-style account menu: a two-line "Hello, <name> / Account" trigger
// (just an icon on narrow screens) opening the account pages and Sign Out.
function AccountMenu({ firstName, onSignOut }: { firstName: string; onSignOut: () => void }) {
  const itemClass = "cursor-pointer gap-2.5 px-3 py-2 text-sm";
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="group flex items-center gap-1.5 rounded-lg px-1 py-1 text-left text-foreground outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-ring"
      >
        <UserRound
          className="h-5 w-5 text-muted-foreground group-hover:text-brand sm:hidden"
          aria-hidden
        />
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="max-w-[9rem] truncate text-xs text-muted-foreground">
            Hello, {firstName}
          </span>
          <span className="text-sm font-semibold">Account</span>
        </span>
        <ChevronDown
          className="hidden h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-52 rounded-xl p-1.5">
        <div className="px-3 pb-2 pt-1.5 text-xs text-muted-foreground sm:hidden">
          Hello, {firstName}
        </div>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/my-models">
            <Library className="h-4 w-4" aria-hidden />
            My Models
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/account/payments">
            <Receipt className="h-4 w-4" aria-hidden />
            Payments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={itemClass}>
          <Link to="/account/settings">
            <Settings className="h-4 w-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onSelect={() => void onSignOut()}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          <Link to="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link to="/license" className="transition-colors hover:text-foreground">
            Standard License
          </Link>
          <Link to="/support" className="transition-colors hover:text-foreground">
            Support
          </Link>
          <Link to="/contact" className="transition-colors hover:text-foreground">
            Contact
          </Link>
          <Link to="/free" className="transition-colors hover:text-foreground">
            Free models
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} 3Dkit — original furniture models by our studio, licensed for
          archviz, interior design and game development.
        </p>
      </div>
    </footer>
  );
}
