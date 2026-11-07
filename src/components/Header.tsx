import { usePresence } from "@/hooks/use-presence";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X, UserRound, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/menu", label: "Menu" },
  { to: "/deals", label: "Deals" },
  { to: "/locations", label: "Locations" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const { user, ready } = useAuth();
  const { count, setCartOpen, hydrated } = useStore();
  const [open, setOpen] = useState(false);
  const menu = usePresence(open, 380);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl transition-shadow ${
        scrolled ? "shadow-[0_1px_0_rgba(15,14,13,0.08)]" : ""
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    activeProps={{ className: "text-foreground font-medium" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {ready && user && user.roles.length > 0 && <Button asChild variant="ghost" className="h-11 px-2 sm:px-3" aria-label="Staff dashboard"><Link to="/admin"><LayoutDashboard aria-hidden="true" /><span className="hidden xl:inline">Dashboard</span></Link></Button>}
          <Button asChild variant="ghost" className="h-11 px-2 sm:px-3" aria-label={user ? "Your account" : "Customer sign in"}>
            <Link to={user ? "/account" : "/auth"}><UserRound aria-hidden="true" /><span className="hidden xl:inline">{ready && user ? "Account" : "Sign in"}</span></Link>
          </Button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${hydrated ? count : 0} items`}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary hover:text-primary"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <Link to="/menu" className="btn-primary hidden sm:inline-flex">
            Order Now
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menu.rendered && (
        <nav aria-label="Mobile" data-state={menu.state} className="menu-in border-t bg-background lg:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            <li><Button asChild variant="ghost" className="h-12 w-full justify-start"><Link to={user ? "/account" : "/auth"} onClick={() => setOpen(false)}><UserRound />{user ? "Your account" : "Customer sign in"}</Link></Button></li>
            {user && user.roles.length > 0 && <li><Button asChild variant="ghost" className="h-12 w-full justify-start"><Link to="/admin" onClick={() => setOpen(false)}><LayoutDashboard />Dashboard</Link></Button></li>}
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-2 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <Link
                to="/menu"
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                Order Now
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
