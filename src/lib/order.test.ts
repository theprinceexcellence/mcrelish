import { expect, it } from "vitest";
import { orderSchema, whatsappOrderUrl, type OrderRequest } from "./order";
const order: OrderRequest = { reference: "MCR-01234567-89AB-4DEF-8123-456789ABCDEF", createdAt: "2026-10-19T15:00:00Z", items: [{ key: "jollof", productId: "mcrelish-jollof", name: "McRelish Jollof Rice", price: 2000, image: "jollof.jpg", quantity: 2, options: { protein: "turkey" }, notes: "No pepper" }], subtotal: 4000, method: "delivery", customer: { name: "Sample Customer", phone: "08000000000", email: "" }, preferredAt: "2026-10-19T18:00:00+01:00", address: "Sample street, Awka", hub: "", notes: "Call on arrival" };
it("uses the business phone for customer-controlled WhatsApp handoff", () => {
  const url = new URL(whatsappOrderUrl(order));
  expect(url.pathname).toBe("/2347070492039");
  expect(url.searchParams.get("text")).toContain(order.reference);
  expect(url.searchParams.get("text")).toContain(order.address);
});
it("itemizes the food total without inventing a delivery fee", () => {
  const message = new URL(whatsappOrderUrl(order)).searchParams.get("text");
  expect(message).toContain("Food total (delivery excluded): ₦4,000");
  expect(message).toContain("Delivery fee: To be confirmed");
});
it("pickup has zero delivery charge and includes the selected hub", () => {
  const message = new URL(whatsappOrderUrl({ ...order, method: "pickup", hub: "Awka Food Hub" })).searchParams.get("text");
  expect(message).toContain("Delivery fee: ₦0");
  expect(message).toContain("Pickup hub: Awka Food Hub");
});
it("uses a complete UUID reference rather than a truncated timestamp", () => {
  expect(orderSchema.safeParse(order).success).toBe(true);
  expect(orderSchema.safeParse({ ...order, reference: "MCR-123456" }).success).toBe(false);
});