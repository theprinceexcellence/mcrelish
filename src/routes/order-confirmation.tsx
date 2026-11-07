import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { ORDER_SESSION_KEY, orderSchema, type OrderRequest } from "@/lib/order";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({ meta: [
    { title: "Your order request | McRelish" },
    { name: "description", content: "Review your McRelish order reference, receipt and pickup or delivery details, then confirm your request with our team." },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: "Your order request | McRelish" },
    { property: "og:description", content: "Your McRelish order details and next steps for confirmation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const [order, setOrder] = useState<OrderRequest | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_SESSION_KEY);
      const parsed = orderSchema.safeParse(raw ? JSON.parse(raw) : null);
      if (parsed.success) setOrder(parsed.data);
    } catch { /* Missing or invalid receipts never render personal details. */ }
    setReady(true);
  }, []);
  if (!ready) return <section className="section-pad px-4 text-center" role="status">Loading your order details…</section>;
  if (order) return <OrderConfirmation order={order} />;
  return <section className="section-pad px-4 text-center"><h1 className="font-display text-4xl font-bold">No order request to show</h1><p className="mt-3 text-sm text-muted-foreground">Complete checkout to prepare your order details.</p><Button asChild className="mt-6"><Link to="/menu">View menu</Link></Button></section>;
}