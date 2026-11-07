import { describe, expect, it } from "vitest";
import { restoreCart } from "./cart-storage";
describe("persistent cart", () => {
  it("restores quantity, protein and kitchen notes for a returning customer", () => {
    const result = restoreCart(JSON.stringify([{ productId: "mcrelish-jollof", quantity: 2, options: { meal: "turkey" }, notes: "No pepper" }]));
    expect(result[0]?.quantity).toBe(2);
    expect(result[0]?.options).toEqual({ meal: "turkey" });
    expect(result[0]?.notes).toBe("No pepper");
  });
  it("uses the published price rather than trusting a stored price", () => {
    expect(restoreCart(JSON.stringify([{ productId: "mcrelish-jollof", quantity: 1, price: 1 }]))[0]?.price).toBe(1800);
  });
  it("discards broken or invalid saved selections", () => {
    expect(restoreCart("bad json")).toEqual([]);
    expect(restoreCart(JSON.stringify([{ productId: "mcrelish-jollof", quantity: -1 }]))).toEqual([]);
  });
});