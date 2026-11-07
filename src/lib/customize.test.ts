import { describe, expect, it } from "vitest";
import { getProduct } from "@/data/menu";
import { nextExtraQty, priceFor } from "./customize";
const jollof = getProduct("mcrelish-jollof")!;
const fried = getProduct("special-fried-rice")!;
describe("special rice pricing", () => {
  it("Special Jollof & Chicken is ₦3,000", () => expect(priceFor(jollof, { options: { meal: "chicken" }, extras: {} })).toBe(3000));
  it("Special Jollof & Egg is ₦1,800", () => expect(priceFor(jollof, { options: { meal: "egg" }, extras: {} })).toBe(1800));
  it("rice with no protein added is ₦1,500", () => expect(priceFor(jollof, { options: { meal: "no-protein" }, extras: {} })).toBe(1500));
  it("adds extras and sides at listed prices", () => expect(priceFor(jollof, { options: { meal: "beef" }, extras: { plantain: 2, water: 1 } })).toBe(3300));
  it("chicken on its own is ₦2,000", () => expect(priceFor(jollof, { options: { meal: "none" }, extras: { chicken: 1 } })).toBe(2000));
  it("coleslaw on its own is ₦1,000", () => expect(priceFor(jollof, { options: { meal: "none" }, extras: { coleslaw: 1 } })).toBe(1000));
  it("fried rice uses the same prices", () => expect(priceFor(fried, { options: { meal: "jumbo-turkey" }, extras: {} })).toBe(5000));
});
describe("extra portion caps", () => {
  it("Extra Rice cannot exceed 1 per plate", () => expect(nextExtraQty(1, 1, 1)).toBe(1));
  it("removing a capped extra drops it to 0", () => expect(nextExtraQty(1, -1, 1)).toBe(0));
  it("uncapped extras keep counting freely", () => expect(nextExtraQty(3, 1)).toBe(4));
});
