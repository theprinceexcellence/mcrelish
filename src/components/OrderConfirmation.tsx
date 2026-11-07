import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CheckCircle2, MapPin, MessageCircle, Phone, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { business } from "@/data/menu";
import { formatNaira } from "@/lib/format";
import { displayOrderTime, whatsappOrderUrl, type OrderRequest } from "@/lib/order";

export function OrderConfirmation({ order }: { order: OrderRequest }) {
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold text-primary">Order request prepared · awaiting confirmation</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Your next meal is one step closer.</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Your details are ready. Send them to McRelish on WhatsApp or call to confirm availability and payment. Nothing has been sent automatically.</p>
        <div className="mt-6 border-y py-4">
          <p className="text-xs text-muted-foreground">Order reference</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold">{order.reference}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prepared {displayOrderTime(order.createdAt)}</p>
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><ShoppingBag className="h-5 w-5 text-primary" />Your order</h2>
            <ul className="mt-3 divide-y">
              {order.items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <img src={item.image} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.quantity} × {item.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatNaira(item.price)} each</p>
                    {(item.details ?? []).map((line) => <p key={line} className="mt-1 text-xs text-muted-foreground">{line}</p>)}
                    {item.notes && <p className="mt-1 break-words text-xs text-muted-foreground">Notes: {item.notes}</p>}
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatNaira(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-3 border-t py-4 text-sm">
              <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{formatNaira(order.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Delivery fee</dt><dd>{order.method === "delivery" ? "To be confirmed" : formatNaira(0)}</dd></div>
              <div className="flex justify-between gap-3 border-t pt-3 font-bold"><dt>{order.method === "delivery" ? "Food total" : "Total"}</dt><dd>{formatNaira(order.subtotal)}</dd></div>
            </dl>
            {order.method === "delivery" && <p className="text-xs text-muted-foreground">Delivery is excluded. McRelish will confirm the delivery fee and final total for your address.</p>}
            <p className="mt-3 text-sm font-semibold">Payment status: not paid</p>
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><MapPin className="h-5 w-5 text-primary" />{order.method === "delivery" ? "Delivery details" : "Pickup details"}</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Detail label="Customer">{order.customer.name}<br />{order.customer.phone}{order.customer.email && <><br />{order.customer.email}</>}</Detail>
              <Detail label={order.method === "delivery" ? "Delivery address" : "Pickup hub"}>{order.method === "delivery" ? order.address : order.hub}</Detail>
              <Detail label="Requested date & time">{displayOrderTime(order.preferredAt)}</Detail>
              {order.notes && <Detail label="Kitchen notes">{order.notes}</Detail>}
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">Food hub hours: {business.hours}. Your requested time is subject to confirmation.</p>
            <h2 className="mt-8 font-display text-2xl font-bold">What happens next</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
              <li>Send your order details on WhatsApp, then tap Send in the chat, or call with your reference.</li>
              <li>McRelish confirms availability, your requested time, and the final total.</li>
              <li>Arrange payment with the team before your meal is prepared for pickup or delivery.</li>
            </ol>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="h-auto min-h-12 whitespace-normal py-3"><a href={whatsappOrderUrl(order)} target="_blank" rel="noopener noreferrer"><MessageCircle />Send order to WhatsApp</a></Button>
              <p className="text-xs text-muted-foreground">Opens WhatsApp with your order and contact details for you to review and send. WhatsApp availability on this number is to be confirmed.</p>
              <Button asChild variant="outline" className="min-h-12"><a href={business.phoneHref}><Phone />Call McRelish</a></Button>
              <Button asChild variant="ghost" className="min-h-12"><Link to="/menu">Back to menu</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-line break-words font-medium">{children}</dd></div>;
}