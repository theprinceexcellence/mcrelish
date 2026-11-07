import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useConfirm } from "@/components/ConfirmProvider";
import { logAudit } from "@/lib/audit";
import { formatNaira } from "@/lib/format";
import { displayOrderTime } from "@/lib/order";
import { EmptyState, PageHeader, Pill, compactFieldClass, fieldClass } from "./ui";

type Status = "new" | "preparing" | "ready" | "completed" | "cancelled";
type Payment = "pending" | "paid" | "failed";
type Method = "pickup" | "delivery";

type Order = {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  method: Method;
  hub: string | null;
  zone_name: string | null;
  address: string | null;
  preferred_at: string;
  items: unknown;
  total: number;
  payment_status: Payment;
  status: Status;
  created_at: string;
};

type OrderItem = {
  name: string;
  quantity: number;
  details: string[];
};

const columns = [
  {
    status: "new",
    label: "New",
    short: "New",
    dot: "bg-primary",
    empty: "No new orders right now.",
  },
  {
    status: "preparing",
    label: "Preparing",
    short: "Preparing",
    dot: "bg-amber-500",
    empty: "Nothing in the kitchen.",
  },
  {
    status: "ready",
    label: "Ready",
    short: "Ready",
    dot: "bg-sky-500",
    empty: "No orders waiting to go out.",
  },
  {
    status: "completed",
    label: "Completed",
    short: "Done",
    dot: "bg-emerald-500",
    empty: "No completed orders yet.",
  },
] as const;

const paymentPill = {
  paid: { tone: "success", text: "Paid" },
  pending: { tone: "warning", text: "Unpaid" },
  failed: { tone: "danger", text: "Failed" },
} as const;

const nextStatus: Partial<Record<Status, Status>> = {
  new: "preparing",
  preparing: "ready",
  ready: "completed",
};

const advanceLabel: Partial<Record<Status, string>> = {
  new: "Start preparing",
  preparing: "Mark ready",
  ready: "Complete order",
};

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function parseItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;

    if (typeof record["name"] !== "string" || typeof record["quantity"] !== "number") {
      return [];
    }

    return [
      {
        name: record["name"],
        quantity: record["quantity"],
        details: Array.isArray(record["details"])
          ? (record["details"] as unknown[]).filter(
              (detail): detail is string => typeof detail === "string",
            )
          : [],
      },
    ];
  });
}

function fulfilment(order: Order) {
  return order.method === "delivery"
    ? `Delivery · ${order.zone_name || "Zone not specified"}`
    : `Pickup · ${order.hub || "Hub not specified"}`;
}

function whatsappUrl(order: Order, items: OrderItem[]) {
  let phone = order.customer_phone.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (/^0\d{10}$/.test(phone)) phone = `234${phone.slice(1)}`;

  if (!phone) return null;

  const message = [
    `Hello ${order.customer_name},`,
    `Order reference: ${order.reference}`,
    "",
    ...items.flatMap((item) => [
      `${item.quantity} × ${item.name}`,
      ...item.details.map((detail) => `  ${detail}`),
    ]),
    "",
    `Total: ${formatNaira(order.total)}`,
    fulfilment(order),
    ...(order.method === "delivery" && order.address ? [`Address: ${order.address}`] : []),
    `Preferred time: ${displayOrderTime(order.preferred_at)}`,
    `Payment: ${order.payment_status}`,
    `Status: ${order.status}`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function LiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | "all">("all");
  const [method, setMethod] = useState<Method | "all">("all");
  const [search, setSearch] = useState("");
  const [activeColumn, setActiveColumn] = useState<Status>("new");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const confirm = useConfirm();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const mountedRef = useRef(false);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    let requestId = 0;
    mountedRef.current = true;

    async function fetchOrders(background = false) {
      const currentRequest = ++requestId;
      if (!background) setLoading(true);

      try {
        const { orders: data } = await api<{ orders: Order[] }>("/api/admin/orders?limit=200");

        if (!active || currentRequest !== requestId) return;

        setOrders(data);
        setUpdatedAt(new Date());
        setFetchError(null);
      } catch {
        if (!active || currentRequest !== requestId) return;
        if (background) return;
        setFetchError("Unable to load orders. Please try again.");
        toast.error("Unable to load orders.");
      } finally {
        if (active && currentRequest === requestId) setLoading(false);
      }
    }

    refreshRef.current = () => void fetchOrders();

    const timer = window.setInterval(() => {
      if (!document.hidden) void fetchOrders(true);
    }, 8000);

    void fetchOrders();

    return () => {
      active = false;
      mountedRef.current = false;
      refreshRef.current = () => {};
      window.clearInterval(timer);
    };
  }, []);

  async function changeStatus(order: Order, to: Status) {
    if (pendingRef.current.has(order.id)) return;

    pendingRef.current.add(order.id);
    setPendingIds(new Set(pendingRef.current));

    try {
      await api(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, {
        body: { status: to },
      });

      void logAudit("order_status", {
        reference: order.reference,
        from: order.status,
        to,
      }).catch(() => {});

      if (mountedRef.current) {
        setOrders((current) =>
          current.map((entry) => (entry.id === order.id ? { ...entry, status: to } : entry)),
        );
        toast.success(`${order.reference} moved to ${to}.`);
        refreshRef.current();
      }
    } catch {
      if (mountedRef.current) toast.error("Unable to update the order status.");
    } finally {
      pendingRef.current.delete(order.id);
      if (mountedRef.current) setPendingIds(new Set(pendingRef.current));
    }
  }

  const query = search.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      (payment === "all" || order.payment_status === payment) &&
      (method === "all" || order.method === method) &&
      (!query ||
        [order.reference, order.customer_name, order.customer_phone].some((value) =>
          value.toLowerCase().includes(query),
        )),
  );
  const cancelled = filtered.filter((order) => order.status === "cancelled");
  const unpaidNew = orders.filter((o) => o.status === "new" && o.payment_status !== "paid").length;

  function renderOrder(order: Order) {
    const items = parseItems(order.items);
    const next = nextStatus[order.status];
    const busy = pendingIds.has(order.id);
    const whatsapp = whatsappUrl(order, items);
    const pay = paymentPill[order.payment_status];
    const FulfilIcon = order.method === "delivery" ? Truck : Store;

    return (
      <article
        key={order.id}
        aria-label={`Order ${order.reference}`}
        aria-busy={busy}
        className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="min-w-0 break-all font-mono text-xs font-medium text-muted-foreground">
              {order.reference}
            </h4>
            <Pill tone={pay.tone} className="shrink-0">
              {pay.text}
            </Pill>
          </div>
          <div className="min-w-0">
            <p className="break-words font-semibold leading-tight">{order.customer_name}</p>
            <p className="break-words text-xs text-muted-foreground">{order.customer_phone}</p>
          </div>
        </div>

        {items.length ? (
          <ul className="space-y-1 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            {items.map((item, index) => (
              <li key={`${index}-${item.name}`} className="break-words">
                <span className="font-medium">
                  {item.quantity} × {item.name}
                </span>
                {item.details.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {item.details.join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No item details available.</p>
        )}

        <div className="space-y-1.5 text-sm">
          <p className="flex items-start gap-2 break-words">
            <FulfilIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span>
              <span className="font-medium">{fulfilment(order)}</span>
              {order.method === "delivery" && (
                <span className="block text-muted-foreground">
                  {order.address || "No delivery address provided"}
                </span>
              )}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>For {displayOrderTime(order.preferred_at)}</span>
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-base font-bold">{formatNaira(order.total)}</span>
          <time
            dateTime={order.created_at}
            title={displayOrderTime(order.created_at)}
            className="text-xs text-muted-foreground"
          >
            {timeAgo(order.created_at)}
          </time>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {next && (
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={() => void changeStatus(order, next)}
            >
              {busy && <Loader2 aria-hidden="true" className="animate-spin" />}
              {advanceLabel[order.status]}
            </Button>
          )}
          {whatsapp ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${order.customer_name} about ${order.reference} (opens in a new tab)`}
              >
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">No phone number</span>
          )}
          {order.status !== "cancelled" && order.status !== "completed" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: `Cancel order ${order.reference}?`,
                  description: "The customer's order will be marked as cancelled.",
                  confirmLabel: "Cancel order",
                  destructive: true,
                });
                if (ok) void changeStatus(order, "cancelled");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </article>
    );
  }

  return (
    <section aria-labelledby="live-orders-heading" className="space-y-5">
      <PageHeader
        id="live-orders-heading"
        title="Live orders"
        description="New orders appear on their own. Times are shown in Lagos time."
        actions={
          <>
            <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {updatedAt
                ? `Live · updated ${updatedAt.toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", second: "2-digit" })}`
                : "Connecting…"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={loading}
              aria-label="Refresh orders"
              onClick={() => refreshRef.current()}
            >
              <RefreshCw aria-hidden="true" className={loading ? "animate-spin" : ""} />
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
          />
          <input
            type="search"
            aria-label="Search orders"
            className={`${fieldClass} pl-9`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reference, name or phone"
          />
        </div>
        <select
          aria-label="Payment"
          className={compactFieldClass}
          value={payment}
          onChange={(event) => setPayment(event.target.value as Payment | "all")}
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Awaiting payment</option>
          <option value="failed">Failed</option>
        </select>
        <select
          aria-label="Method"
          className={compactFieldClass}
          value={method}
          onChange={(event) => setMethod(event.target.value as Method | "all")}
        >
          <option value="all">Pickup and delivery</option>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      {unpaidNew > 0 && (
        <p role="status" className="rounded-xl bg-amber-100 px-4 py-2.5 text-sm text-amber-900">
          {unpaidNew} new {unpaidNew === 1 ? "order is" : "orders are"} still awaiting payment. Wait
          for the Paid badge before preparing.
        </p>
      )}

      {fetchError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError} Use the refresh button to retry.
        </p>
      )}

      <div
        className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 lg:hidden"
        aria-label="Order status"
      >
        {columns.map((column) => {
          const count = filtered.filter((order) => order.status === column.status).length;
          const selected = activeColumn === column.status;
          return (
            <button
              key={column.status}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveColumn(column.status)}
              className={`rounded-lg px-1 py-2 text-xs font-medium transition-colors ${selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {column.short} <span className="font-semibold">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
        {columns.map((column) => {
          const entries = filtered.filter((order) => order.status === column.status);

          return (
            <section
              key={column.status}
              aria-labelledby={`orders-${column.status}`}
              className={`min-w-0 space-y-3 rounded-2xl bg-muted/60 p-2.5 lg:block ${activeColumn === column.status ? "block" : "hidden"}`}
            >
              <header className="flex items-center justify-between px-1.5 pt-1">
                <h3
                  id={`orders-${column.status}`}
                  className="flex items-center gap-2 text-sm font-semibold"
                >
                  <span aria-hidden="true" className={`size-2 rounded-full ${column.dot}`} />
                  {column.label}
                </h3>
                <span
                  aria-label={`${entries.length} ${column.label.toLowerCase()} orders`}
                  className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold shadow-sm"
                >
                  {entries.length}
                </span>
              </header>
              {loading && entries.length === 0 && (
                <div role="status" aria-label="Loading orders" className="space-y-3">
                  <div className="h-52 animate-pulse rounded-xl bg-card" />
                  <div className="h-36 animate-pulse rounded-xl bg-card" />
                </div>
              )}
              {entries.map(renderOrder)}
              {!loading && entries.length === 0 && (
                <EmptyState
                  icon={Inbox}
                  title={
                    orders.length > 0 && filtered.length === 0 ? "No orders match" : column.empty
                  }
                />
              )}
            </section>
          );
        })}
      </div>

      <details className="rounded-2xl border border-border bg-card">
        <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium text-muted-foreground">
          Cancelled orders ({cancelled.length})
        </summary>
        <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {cancelled.map(renderOrder)}
          {cancelled.length === 0 && (
            <p className="text-sm text-muted-foreground">No cancelled orders match.</p>
          )}
        </div>
      </details>
    </section>
  );
}

export default LiveOrders;
