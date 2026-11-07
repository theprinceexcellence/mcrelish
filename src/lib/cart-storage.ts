import { z } from "zod";
import { products, type Product } from "@/data/menu";
import type { CartItem } from "@/lib/store";
import { describeSelection, isValidSelection, priceFor } from "@/lib/customize";

export const CART_STORAGE_KEY = "mcrelish-cart-v1";
const kv = (o: Record<string, string | number>) => Object.entries(o).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("|");
export const cartKey = (id: string, options: Record<string, string>, notes = "", extras: Record<string, number> = {}) =>
  `${id}::${kv(extras)}::${Object.entries(options).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("|")}::${notes}`;

const selection = z.object({
  productId: z.string(), quantity: z.number().int().positive().safe(),
  options: z.record(z.string()).default({}), extras: z.record(z.number().int().nonnegative()).default({}), notes: z.string().optional(),
});

export function restoreCart(raw: string | null, catalog: Product[] = products): CartItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const result: CartItem[] = [];
    for (const entry of value) {
      const parsed = selection.safeParse(entry);
      if (!parsed.success) continue;
      const product = catalog.find(p => p.id === parsed.data.productId);
      if (!product?.available) continue;
      const { quantity, notes } = parsed.data;
      const options: Record<string, string> = {};
      for (const group of product.options ?? []) {
        const chosen = group.choices.find((choice) => choice.id === parsed.data.options[group.id]) ?? group.choices[0];
        if (chosen) options[group.id] = chosen.id;
      }
      if (product.meals) {
        const meal = product.meals.find((m) => m.id === parsed.data.options["meal"]) ?? product.meals[0];
        if (!meal) continue;
        options["meal"] = meal.id;
      }
      const extras: Record<string, number> = {};
      for (const e of product.extras ?? []) { const q = parsed.data.extras[e.id]; if (q && q > 0) extras[e.id] = q; }
      const sel = { options, extras };
      if (!isValidSelection(product, sel)) continue;
      const key = cartKey(product.id, options, notes, extras);
      const existing = result.find((item) => item.key === key);
      if (existing) existing.quantity += quantity;
      else result.push({ key, productId: product.id, name: product.name, price: priceFor(product, sel), image: product.image, quantity, options, extras, details: describeSelection(product, sel), notes });
    }
    return result;
  } catch { return []; }
}