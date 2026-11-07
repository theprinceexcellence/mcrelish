import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  ImageIcon,
  ClipboardList,
  Loader2,
  LogOut,
  ShieldAlert,
  Truck,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LiveOrders } from "@/components/admin/LiveOrders";
import { MenuManager } from "@/components/admin/MenuManager";
import { DeliverySettings } from "@/components/admin/DeliverySettings";
import { SalesAnalytics } from "@/components/admin/SalesAnalytics";
import { StaffAudit } from "@/components/admin/StaffAudit";
import { Banner } from "@/components/admin/Banner";
import { initials } from "@/components/admin/ui";

type Role = "admin" | "staff" | "dispatcher";
type Tab = "orders" | "menu" | "delivery" | "analytics" | "banner" | "staff";

const TABS: { id: Tab; label: string; short: string; icon: LucideIcon; roles: Role[] }[] = [
  {
    id: "orders",
    label: "Live Orders",
    short: "Orders",
    icon: ClipboardList,
    roles: ["admin", "staff", "dispatcher"],
  },
  {
    id: "menu",
    label: "Menu Manager",
    short: "Menu",
    icon: UtensilsCrossed,
    roles: ["admin", "staff"],
  },
  {
    id: "delivery",
    label: "Delivery & Settings",
    short: "Delivery",
    icon: Truck,
    roles: ["admin"],
  },
  { id: "analytics", label: "Sales Analytics", short: "Sales", icon: BarChart3, roles: ["admin"] },
  { id: "banner", label: "Home Banner", short: "Banner", icon: ImageIcon, roles: ["admin"] },
  { id: "staff", label: "Staff & Activity", short: "Staff", icon: Users, roles: ["admin"] },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  staff: "Food Hub Staff",
  dispatcher: "Delivery Dispatch",
};

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.some((t) => t.id === search["tab"]) ? { tab: search["tab"] as Tab } : {},
  head: () => ({
    meta: [
      { title: "Restaurant Dashboard | McRelish" },
      { name: "description", content: "Manage McRelish orders, menu, delivery, staff and sales." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Restaurant Dashboard | McRelish" },
      {
        property: "og:description",
        content: "Manage McRelish orders, menu, delivery, staff and sales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, ready, signOut } = useAuth();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const roles: Role[] | null = user ? user.roles : null;

  if (!ready) return <Gate icon={Loader2} spin title="Loading your dashboard" />;
  if (!user) {
    return (
      <Gate
        icon={ShieldAlert}
        title="Sign in to manage McRelish"
        text="Use the staff account you were invited with."
      >
        <Button asChild className="mt-6">
          <Link to="/auth" search={{ next: "admin" }}>
            Sign in
          </Link>
        </Button>
      </Gate>
    );
  }
  if (!roles?.length) {
    return (
      <Gate
        icon={ShieldAlert}
        title="Staff only"
        text="This account doesn't have staff access. Ask an admin to add your role."
      >
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Back to website</Link>
        </Button>
      </Gate>
    );
  }

  const visible = TABS.filter((t) => t.roles.some((r) => roles.includes(r)));
  const active = visible.find((t) => t.id === tab) ?? visible[0]!;
  const roleText = roles.map((r) => ROLE_LABEL[r]).join(", ");

  const logout = () => void signOut().catch(() => toast.error("Unable to sign out. Please retry."));

  return (
    <div className="admin-ui min-h-screen bg-muted/40 lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-t-0 lg:pb-0">
        <Link
          to="/"
          className="hidden items-center gap-2.5 px-5 py-5 lg:flex"
          aria-label="McRelish website"
        >
          <img src="/favicon.png" alt="" className="size-8" />
          <span className="leading-tight">
            <span className="block text-base font-bold">
              Mc<span className="text-primary">Relish</span>
            </span>
            <span className="block text-xs text-muted-foreground">Restaurant dashboard</span>
          </span>
        </Link>

        <div
          role="tablist"
          aria-label="Dashboard sections"
          aria-orientation="vertical"
          className="flex lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:px-3 lg:py-2"
        >
          {visible.map((t) => {
            const selected = active.id === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() =>
                  void navigate({ search: { tab: t.id }, replace: true, resetScroll: false })
                }
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-medium transition-colors lg:flex-none lg:flex-row lg:gap-3 lg:rounded-lg lg:px-3 lg:py-2.5 lg:text-sm ${
                  selected
                    ? "text-primary lg:bg-primary/10"
                    : "text-muted-foreground hover:text-foreground lg:hover:bg-muted"
                }`}
              >
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary lg:hidden"
                  />
                )}
                <t.icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate lg:hidden">{t.short}</span>
                <span className="hidden truncate lg:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden border-t border-border p-3 lg:block">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(user.email)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium" title={user.email}>
                {user.email}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{roleText}</span>
            </span>
          </div>
          <div className="mt-1 grid gap-1">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link to="/">
                <ExternalLink />
                View website
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" onClick={logout}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link to="/" className="flex items-center gap-2" aria-label="McRelish website">
            <img src="/favicon.png" alt="" className="size-7" />
            <span className="text-sm font-semibold">{active.label}</span>
          </Link>
          <div className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(user.email)}
            </span>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={logout}>
              <LogOut />
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          <h1 className="sr-only">Dashboard</h1>
          <div key={active.id} role="tabpanel" aria-label={active.label}>
            {active.id === "orders" && <LiveOrders />}
            {active.id === "menu" && <MenuManager canManage={roles.includes("admin")} />}
            {active.id === "delivery" && <DeliverySettings />}
            {active.id === "analytics" && <SalesAnalytics />}
            {active.id === "banner" && <Banner />}
            {active.id === "staff" && <StaffAudit />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Gate({
  icon: Icon,
  title,
  text,
  spin,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  spin?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="admin-ui grid min-h-screen place-items-center bg-muted/40 px-4">
      <div
        role="status"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className={`size-6 ${spin ? "animate-spin" : ""}`} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
        {children}
      </div>
    </section>
  );
}
