import { describe, expect, it } from "vitest";
import { priceOrder } from "@/lib/order-pricing";
import { toPriceMap } from "@/lib/pricing";

const jollof = (options: Record<string, string>, extras: Record<string, number> = {}, quantity = 1) =>
  ({ productId: "mcrelish-jollof", quantity, options, extras });

describe("server order pricing", () => {
  it("charges published prices and ignores anything the browser claims", () => {
    const { subtotal } = priceOrder([jollof({ meal: "chicken" }, { plantain: 1, water: 1 })], toPriceMap([]));
    expect(subtotal).toBe(3800);
  });
  it("uses admin price changes", () => {
    const map = toPriceMap([{ key: "m:mcrelish-jollof:chicken", price: 3500, available: true }]);
    expect(priceOrder([jollof({ meal: "chicken" }, {}, 2)], map).subtotal).toBe(7000);
  });
  it("caps Extra Rice at 1 per plate", () => {
    expect(priceOrder([jollof({ meal: "beef" }, { rice: 3 })], toPriceMap([])).subtotal).toBe(3000);
  });
  it("rejects items an admin switched off", () => {
    const map = toPriceMap([{ key: "p:solo-chicken", price: 2000, available: false }]);
    expect(() => priceOrder([{ productId: "solo-chicken", quantity: 1, options: {}, extras: {} }], map)).toThrow();
  });
  it("rejects Fried Rice while it is coming soon", () => {
    expect(() => priceOrder([{ productId: "special-fried-rice", quantity: 1, options: { meal: "egg" }, extras: {} }], toPriceMap([]))).toThrow();
  });
});
