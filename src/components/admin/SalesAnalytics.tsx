import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Download,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Range = "daily" | "weekly" | "monthly";

type Order = {
  reference: string;
  customer_name: string | null;
  items: unknown;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  method: string;
};

type Bucket = {
  key: number;
  label: string;
  title: string;
  value: number;
};

const TIME_ZONE = "Africa/Lagos";
const DAY = 86_400_000;
const RANGES: Range[] = ["daily", "weekly", "monthly"];

const lagosParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const exportDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

function lagosDay(value: string | Date): number {
  const parts = lagosParts.formatToParts(
    typeof value === "string" ? new Date(value) : value,
  );
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"));
}

// Calendar keys are synthetic UTC dates representing Lagos calendar dates.
// They are not order timestamps.
function bucketKey(day: number, range: Range): number {
  const date = new Date(day);
  if (range === "monthly") {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  }
  if (range === "weekly") {
    return day - ((date.getUTCDay() + 6) % 7) * DAY;
  }
  return day;
}

function makeBuckets(range: Range, today: number): Bucket[] {
  const count = range === "daily" ? 14 : range === "weekly" ? 8 : 6;
  const current = bucketKey(today, range);
  const month = new Date(current);
  const labelFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    ...(range === "monthly"
      ? { month: "short" as const, year: "2-digit" as const }
      : { day: "numeric" as const, month: "short" as const }),
  });
  const titleFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return Array.from({ length: count }, (_, index) => {
    const offset = index - count + 1;
    const key =
      range === "monthly"
        ? Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1)
        : current + offset * DAY * (range === "weekly" ? 7 : 1);
    const displayDate = new Date(key + DAY / 2);

    return {
      key,
      label: labelFormatter.format(displayDate),
      title: `${range === "weekly" ? "Week of " : ""}${titleFormatter.format(displayDate)}`,
      value: 0,
    };
  });
}

function isVerified(order: Order): boolean {
  return order.payment_status === "paid" && order.status !== "cancelled";
}

function amount(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // Neutralize spreadsheet formulas in customer-controlled text.
  const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function SalesAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [range, setRange] = useState<Range>("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [today, setToday] = useState(() => lagosDay(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday(lagosDay(new Date()));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError(false);

      try {
        const { orders: data } = await api<{ orders: Order[] }>("/api/admin/sales");
        if (active) setOrders(data);
      } catch {
        if (active) {
          setError(true);
          toast.error("Unable to load sales analytics.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, [attempt]);

  const analytics = useMemo(() => {
    const buckets = makeBuckets(range, today);
    const allowedKeys = new Set(buckets.map((bucket) => bucket.key));
    const filtered = orders.filter((order) =>
      allowedKeys.has(bucketKey(lagosDay(order.created_at), range)),
    );
    const paid = filtered.filter(isVerified);
    const revenue = paid.reduce((sum, order) => sum + amount(order.total), 0);
    const byBucket = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    const meals = new Map<string, { name: string; units: number; revenue: number }>();

    for (const order of paid) {
      const bucket = byBucket.get(bucketKey(lagosDay(order.created_at), range));
      if (bucket) bucket.value += amount(order.total);

      if (!Array.isArray(order.items)) continue;
      for (const raw of order.items) {
        if (!raw || typeof raw !== "object") continue;
        const item = raw as Record<string, unknown>;
        const name = typeof item["name"] === "string" ? (item["name"] as string).trim() : "";
        const quantity = amount(item["quantity"]);
        const price = amount(item["price"]);
        if (!name || quantity <= 0 || price < 0) continue;

        const meal = meals.get(name) ?? { name, units: 0, revenue: 0 };
        meal.units += quantity;
        meal.revenue += quantity * price;
        meals.set(name, meal);
      }
    }

    const groups = [
      { label: "Paid", orders: paid },
      {
        label: "Pending verification",
        orders: filtered.filter(
          (order) =>
            order.payment_status === "pending" && order.status !== "cancelled",
        ),
      },
      {
        label: "Failed/Cancelled",
        orders: filtered.filter(
          (order) =>
            order.payment_status === "failed" || order.status === "cancelled",
        ),
      },
    ];

    return {
      filtered,
      buckets,
      revenue,
      paidCount: paid.length,
      average: paid.length ? revenue / paid.length : 0,
      todayCount: filtered.filter(
        (order) => lagosDay(order.created_at) === today,
      ).length,
      groups,
      meals: [...meals.values()]
        .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
        .slice(0, 5),
    };
  }, [orders, range, today]);

  function downloadCsv() {
    const rows = [
      ["reference", "Lagos date", "customer", "method", "total", "payment_status", "status"],
      ...analytics.filtered.map((order) => [
        order.reference,
        exportDate.format(new Date(order.created_at)),
        order.customer_name ?? "",
        order.method,
        amount(order.total),
        order.payment_status,
        order.status,
      ]),
    ];
    const csv = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mcrelish-sales-${range}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading sales analytics" className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((n) => <div key={n} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6" role="alert">
        <p className="mb-4 text-muted-foreground">Sales analytics could not be loaded.</p>
        <Button onClick={() => setAttempt((value) => value + 1)}>Try again</Button>
      </div>
    );
  }

  const metrics = [
    { label: "Verified revenue", value: formatNaira(analytics.revenue), icon: Wallet },
    { label: "Paid order count", value: analytics.paidCount.toLocaleString(), icon: BadgeCheck },
    { label: "Average order value", value: formatNaira(analytics.average), icon: Receipt },
    { label: "Orders today", value: analytics.todayCount.toLocaleString(), icon: ShoppingBag },
  ];
  const maximum = Math.max(1, ...analytics.buckets.map((bucket) => bucket.value));

  return (
    <section className="space-y-6" aria-label="Sales analytics">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Sales analytics</h2>
          <p className="text-sm text-muted-foreground">
            Latest 1,000 orders · ranges use order creation dates in Lagos.
          </p>
        </div>
        <Button onClick={downloadCsv} disabled={!analytics.filtered.length}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </header>

      <div className="inline-flex gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Sales date range">
        {RANGES.map((value) => (
          <Button
            key={value}
            variant={range === value ? "default" : "ghost"}
            size="sm"
            aria-pressed={range === value}
            onClick={() => setRange(value)}
          >
            {value === "daily" ? "Daily" : value === "weekly" ? "Weekly" : "Monthly"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
            </div>
            <p className="mt-3 break-words text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {!analytics.filtered.length && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No orders in this range. Try another range.
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Verified revenue</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {range === "daily"
            ? "Last 14 Lagos days"
            : range === "weekly"
              ? "Last 8 weeks · Monday starts"
              : "Last 6 months"}{" "}
          · includes the current partial period.
        </p>
        {!analytics.paidCount ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No verified revenue in this range.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-[560px] gap-2">
              {analytics.buckets.map((bucket) => (
                <div key={bucket.key} className="min-w-0 flex-1">
                  <div className="flex h-48 items-end">
                    <div
                      className="w-full rounded-t bg-primary"
                      style={{ height: `${(bucket.value / maximum) * 100}%` }}
                      title={`${bucket.title}: ${formatNaira(bucket.value)}`}
                      role="img"
                      aria-label={`${bucket.title}: ${formatNaira(bucket.value)}`}
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    {bucket.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Payment reconciliation</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {analytics.groups.map((group) => (
            <div key={group.label} className="rounded-2xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">{group.label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {formatNaira(
                  group.orders.reduce((sum, order) => sum + amount(order.total), 0),
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.orders.length} {group.orders.length === 1 ? "order" : "orders"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cancelled orders appear only in Failed/Cancelled, even if paid.
          Pending and failed amounts are not verified revenue.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-base font-semibold">Top-selling meals</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Paid, non-cancelled orders · ranked by units sold.
        </p>
        {!analytics.meals.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No meal sales in this range.
          </p>
        ) : (
          <ol className="mt-4 space-y-5">
            {analytics.meals.map((meal) => (
              <li key={meal.name}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{meal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {meal.units.toLocaleString()} units sold
                    </p>
                  </div>
                  <p className="shrink-0 text-sm">{formatNaira(meal.revenue)}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-2xl bg-muted">
                  <div
                    className="h-full rounded-2xl bg-gold"
                    style={{
                      width: `${(meal.units / (analytics.meals[0]?.units ?? 1)) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
