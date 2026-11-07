import { z } from "zod";
import { products, type Product } from "@/data/menu";
import { describeSelection, isValidSelection, priceFor } from "@/lib/customize";
import { pricedProduct, type PriceMap } from "@/lib/pricing";

export const orderLineSchema = z.object({
  productId: z.string().max(80),
  quantity: z.number().int().min(1).max(50),
  options: z.record(z.string().max(80)).default({}),
  extras: z.record(z.number().int().min(0).max(20)).default({}),
  notes: z.string().max(300).optional(),
});
export type OrderLine = z.infer<typeof orderLineSchema>;

export type PricedLine = {
  productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number;
  details: string[]; notes: string; options: Record<string, string>; extras: Record<string, number>;
};

/** Recompute every line from catalog structure + database prices. Never trusts client prices. */
export function priceOrder(lines: OrderLine[], map: PriceMap, catalog: Product[] = products): { items: PricedLine[]; subtotal: number } {
  const items = lines.map((line) => {
    const raw = catalog.find((p) => p.id === line.productId);
    if (!raw) throw new Error("An item in your cart is no longer on the menu.");
    const product = pricedProduct(raw, map);
    if (!product.available) throw new Error(`${product.name} is not available right now.`);
    const options: Record<string, string> = {};
    for (const group of product.options ?? []) {
      const choice = group.choices.find((c) => c.id === line.options[group.id]) ?? group.choices[0];
      if (!choice) throw new Error(`Please review your choices for ${product.name}.`);
      options[group.id] = choice.id;
    }
    if (product.meals) {
      const meal = product.meals.find((m) => m.id === line.options["meal"]);
      if (!meal) throw new Error(`Please choose a protein again for ${product.name}.`);
      options["meal"] = meal.id;
    }
    const extras: Record<string, number> = {};
    for (const [id, qty] of Object.entries(line.extras)) {
      if (qty <= 0) continue;
      const extra = product.extras?.find((e) => e.id === id);
      if (!extra) throw new Error(`An add-on for ${product.name} is no longer available.`);
      extras[id] = extra.max !== undefined ? Math.min(extra.max, qty) : qty;
    }
    const sel = { options, extras };
    if (!isValidSelection(product, sel)) throw new Error(`Please review your choices for ${product.name}.`);
    const unitPrice = priceFor(product, sel);
    return {
      productId: product.id, name: product.name, quantity: line.quantity, unitPrice,
      lineTotal: unitPrice * line.quantity, details: describeSelection(product, sel),
      notes: line.notes?.trim() ?? "", options, extras,
    };
  });
  return { items, subtotal: items.reduce((s, i) => s + i.lineTotal, 0) };
}
