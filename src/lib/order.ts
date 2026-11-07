import { z } from "zod";
import { business } from "@/data/menu";
import { formatNaira } from "@/lib/format";

export const ORDER_SESSION_KEY = "mcrelish-order-request-v1";

const orderItemSchema = z.object({
  key: z.string(), productId: z.string(), name: z.string(),
  price: z.number().finite().nonnegative(), image: z.string(),
  quantity: z.number().int().positive(), options: z.record(z.string()), extras: z.record(z.number()).optional(), details: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const orderSchema = z.object({
  reference: z.string().regex(/^MCR-[0-9A-F-]{36}$/),
  createdAt: z.string(), items: z.array(orderItemSchema).min(1),
  subtotal: z.number().finite().nonnegative(),
  method: z.enum(["pickup", "delivery"]),
  customer: z.object({ name: z.string(), phone: z.string(), email: z.string() }),
  preferredAt: z.string(), address: z.string(), hub: z.string(), notes: z.string(),
});

export type OrderRequest = z.infer<typeof orderSchema>;

export function displayOrderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos",
  }).format(date) + " (Lagos time)";
}

export function whatsappOrderUrl(order: OrderRequest) {
  const lines = [
    "Hello McRelish, please confirm my order request.",
    `Reference: ${order.reference}`,
    "", "ITEMS",
    ...order.items.flatMap((item) => [
      `${item.quantity} × ${item.name} @ ${formatNaira(item.price)} = ${formatNaira(item.price * item.quantity)}`,
      ...(item.details ?? Object.entries(item.options).map(([key, value]) => `${key}: ${value}`)).map((line) => `  ${line}`),
      ...(item.notes ? [`  Item notes: ${item.notes}`] : []),
    ]),
    "", `Subtotal: ${formatNaira(order.subtotal)}`,
    `Delivery fee: ${order.method === "pickup" ? formatNaira(0) : "To be confirmed"}`,
    `${order.method === "pickup" ? "Total" : "Food total (delivery excluded)"}: ${formatNaira(order.subtotal)}`,
    "Payment: not paid; please confirm payment arrangements.",
    "", `Method: ${order.method}`,
    ...(order.method === "delivery" ? [`Delivery address: ${order.address}`] : [`Pickup hub: ${order.hub}`]),
    `Requested for: ${displayOrderTime(order.preferredAt)}`,
    `Customer: ${order.customer.name}`, `Phone: ${order.customer.phone}`,
    ...(order.customer.email ? [`Email: ${order.customer.email}`] : []),
    ...(order.notes ? [`Kitchen notes: ${order.notes}`] : []),
    "Please confirm availability, timing, and the final total before preparation.",
  ];
  return `https://wa.me/${business.phone.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`;
}