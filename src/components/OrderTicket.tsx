import { forwardRef } from "react";
import { business } from "@/data/menu";
import { formatNaira } from "@/lib/format";
import { displayOrderTime } from "@/lib/order";

export type TicketItem = { name: string; quantity: number; unitPrice: number; lineTotal: number; details: string[]; notes: string };
export type Ticket = {
  reference: string; customer_name: string; customer_phone: string; customer_email: string;
  method: string; hub: string | null; zone_name: string | null; address: string | null;
  preferred_at: string; notes: string | null; items: TicketItem[];
  subtotal: number; delivery_fee: number; total: number; payment_status: string;
  paid_at: string | null; created_at: string; flw_transaction_id: string | null;
};

/** Branded order ticket. Rendered on screen and captured as the downloadable PDF. */
export const OrderTicket = forwardRef<HTMLDivElement, { ticket: Ticket }>(function OrderTicket({ ticket }, ref) {
  const paid = ticket.payment_status === "paid";
  return (
    <div ref={ref} className="mx-auto w-full max-w-[640px] overflow-hidden rounded-3xl bg-card text-card-foreground shadow-card">
      <div className="relative bg-primary px-8 pb-10 pt-8 text-primary-foreground">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card p-1.5"><img src="/mcrelish-logo.png" alt="" aria-hidden="true" className="h-full w-auto" /></span>
            <div>
              <p className="font-display text-3xl font-bold leading-none">McRelish</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] opacity-80">Order ticket</p>
            </div>
          </div>
          <span className={`rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${paid ? "border-gold bg-gold text-gold-foreground" : "border-primary-foreground/60"}`}>
            {paid ? "Paid" : "Unpaid"}
          </span>
        </div>
        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] opacity-80">Reference</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{ticket.reference}</p>
      </div>

      <div className="relative">
        <span className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-background" aria-hidden="true" />
        <span className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-background" aria-hidden="true" />
        <div className="mx-6 border-t-2 border-dashed border-border" />
      </div>

      <div className="grid gap-6 px-8 py-7 sm:grid-cols-2">
        <Block label="Customer">
          <p className="font-semibold">{ticket.customer_name}</p>
          <p>{ticket.customer_phone}</p>
          <p className="break-all">{ticket.customer_email}</p>
        </Block>
        <Block label={ticket.method === "delivery" ? "Delivery" : "Pickup"}>
          {ticket.method === "delivery" ? (
            <><p className="font-semibold">{ticket.zone_name}</p><p className="whitespace-pre-line break-words">{ticket.address}</p></>
          ) : <p className="font-semibold">{ticket.hub}</p>}
          <p className="mt-1 text-muted-foreground">{displayOrderTime(ticket.preferred_at)}</p>
        </Block>
      </div>

      <div className="px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Items</p>
        <ul className="mt-2 divide-y divide-border">
          {ticket.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">{item.quantity} × {item.name}</p>
                {item.details.map((d) => <p key={d} className="text-xs text-muted-foreground">{d}</p>)}
                {item.notes && <p className="text-xs italic text-muted-foreground">“{item.notes}”</p>}
              </div>
              <span className="shrink-0 font-semibold">{formatNaira(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t-2 border-ink py-4 text-sm">
          <Row label="Subtotal" value={formatNaira(ticket.subtotal)} />
          <Row label={ticket.method === "delivery" ? "Delivery fee" : "Pickup"} value={formatNaira(ticket.delivery_fee)} />
          <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total {paid ? "paid" : "due"}</dt><dd className="text-primary">{formatNaira(ticket.total)}</dd></div>
        </dl>
        {ticket.notes && <p className="rounded-xl bg-muted px-4 py-3 text-xs"><span className="font-semibold">Kitchen notes: </span>{ticket.notes}</p>}
      </div>

      <div className="mt-6 bg-muted px-8 py-5 text-xs text-muted-foreground">
        <div className="flex flex-wrap justify-between gap-2">
          <span>Ordered {displayOrderTime(ticket.created_at)}</span>
          {ticket.paid_at && <span>Paid {displayOrderTime(ticket.paid_at)}</span>}
        </div>
        {ticket.flw_transaction_id && <p className="mt-1">Payment ID {ticket.flw_transaction_id}</p>}
        <p className="mt-3 font-medium text-foreground">{business.phone} · {business.email} · {business.city}</p>
        <p className="mt-1">Show this ticket at pickup or to your delivery rider.</p>
      </div>
    </div>
  );
});

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="text-sm"><p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>;
}
