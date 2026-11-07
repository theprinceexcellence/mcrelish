import { api } from "./api";
import type { OrderLine, PricedLine } from "./order-pricing";

type CheckoutInput = {
  items: OrderLine[];
  method: "pickup" | "delivery";
  customer: { name: string; phone: string; email: string };
  preferredAt: string;
  address: string;
  hub: string;
  zoneId: string | null;
  notes: string;
  origin: string;
};

/** Saves the order (prices are recomputed by the server) and returns the Flutterwave payment link. */
export function createCheckout({ data }: { data: CheckoutInput }) {
  return api<{ reference: string; token: string; link: string; total: number }>("/api/orders", { body: data });
}

/** Checks a payment with the server, which re-verifies it with Flutterwave. */
export function confirmPayment({ data }: { data: { reference: string; token: string; transactionId?: string } }) {
  return api<{ status: string }>("/api/orders/confirm", { body: data });
}

export type TicketData = {
  reference: string; customer_name: string; customer_phone: string; customer_email: string;
  method: "pickup" | "delivery"; hub: string | null; zone_name: string | null; address: string | null;
  preferred_at: string; notes: string | null; items: PricedLine[]; subtotal: number; delivery_fee: number; total: number;
  payment_status: string; status: string; paid_at: string | null; created_at: string; flw_transaction_id: string | null;
};

export function getTicket({ data }: { data: { reference: string; token: string } }) {
  return api<TicketData>(`/api/orders/${encodeURIComponent(data.reference)}?token=${encodeURIComponent(data.token)}`);
}
