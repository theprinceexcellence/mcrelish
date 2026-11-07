import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmPayment } from "@/lib/orders.functions";
import { getTicketAccess } from "@/lib/ticket-access";
import { business } from "@/data/menu";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/payment/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s["ref"] === "string" ? s["ref"] : "",
    status: typeof s["status"] === "string" ? s["status"] : "",
    // The router turns a numeric id such as 1147 into a number, so accept both.
    transaction_id: typeof s["transaction_id"] === "string" || typeof s["transaction_id"] === "number" ? String(s["transaction_id"]) : "",
  }),
  head: () => ({ meta: [
    { title: "Confirming your payment | McRelish" },
    { name: "description", content: "We are confirming your McRelish payment." },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: "Confirming your payment | McRelish" },
    { property: "og:description", content: "We are confirming your McRelish payment." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { ref, status, transaction_id } = Route.useSearch();
  const navigate = useNavigate();
  const { clearCart } = useStore();
  const [state, setState] = useState<"checking" | "failed" | "pending" | "missing">("checking");

  useEffect(() => {
    const token = getTicketAccess(ref);
    if (!ref || !token) { setState("missing"); return; }
    let tries = 0;
    let cancelled = false;
    const check = async () => {
      try {
        const res = await confirmPayment({ data: { reference: ref, token, ...(transaction_id ? { transactionId: transaction_id } : {}) } });
        if (cancelled) return;
        if (res.status === "paid") { clearCart(); await navigate({ to: "/ticket/$reference", params: { reference: ref } }); return; }
        if (res.status === "failed" || status === "cancelled") { setState("failed"); return; }
      } catch { /* retry below */ }
      if (++tries < 6 && !cancelled) setTimeout(check, 2500); else if (!cancelled) setState("pending");
    };
    void check();
    return () => { cancelled = true; };
  }, [ref, status, transaction_id, navigate, clearCart]);

  return (
    <section className="section-pad px-4">
      <div className="mx-auto max-w-lg text-center">
        {state === "checking" && (<div role="status"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /><h1 className="mt-5 font-display text-4xl font-bold">Confirming your payment…</h1><p className="mt-3 text-sm text-muted-foreground">This takes a few seconds. Please keep this page open.</p></div>)}
        {state === "failed" && (<><XCircle className="mx-auto h-10 w-10 text-destructive" /><h1 className="mt-5 font-display text-4xl font-bold">Payment not completed</h1><p className="mt-3 text-sm text-muted-foreground">You were not charged for order {ref}. Your cart is still saved.</p><Button asChild className="mt-6"><Link to="/checkout">Try again</Link></Button></>)}
        {state === "pending" && (<><h1 className="font-display text-4xl font-bold">Still confirming</h1><p className="mt-3 text-sm text-muted-foreground">Your bank hasn't confirmed yet. Refresh in a minute, or call {business.phone} with reference {ref}.</p><Button className="mt-6" onClick={() => window.location.reload()}>Check again</Button></>)}
        {state === "missing" && (<><h1 className="font-display text-4xl font-bold">We couldn't open this order here</h1><p className="mt-3 text-sm text-muted-foreground">Please open the link on the device you paid from, or call {business.phone}{ref ? ` with reference ${ref}` : ""}.</p><Button asChild className="mt-6"><Link to="/menu">Back to menu</Link></Button></>)}
      </div>
    </section>
  );
}
