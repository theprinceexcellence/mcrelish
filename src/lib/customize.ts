import type { Product } from "@/data/menu";
import { formatNaira } from "@/lib/format";

export const NO_MEAL = "none";

export type Selection = { options: Record<string, string>; extras: Record<string, number> };

/** Price of one unit of a product with the given selection, using published prices only. */
export function priceFor(product: Product, sel: Selection): number {
  if (!product.meals) return product.price;
  const mealId = sel.options["meal"] ?? product.meals[0]!.id;
  const meal = product.meals.find((m) => m.id === mealId);
  const chosen = (product.extras ?? [])
    .map((e) => ({ e, qty: Math.max(0, Math.floor(sel.extras[e.id] ?? 0)) }))
    .filter((x) => x.qty > 0);
  const extrasTotal = chosen.reduce((sum, { e, qty }) => sum + e.price * qty, 0);
  if (mealId === NO_MEAL || !meal) {
    const units = chosen.reduce((s, x) => s + x.qty, 0);
    if (units === 1 && chosen[0]!.e.soloPrice) return chosen[0]!.e.soloPrice;
    return extrasTotal;
  }
  return meal.price + extrasTotal;
}

export function isValidSelection(product: Product, sel: Selection) {
  if (!product.meals) return true;
  if ((sel.options["meal"] ?? "") !== NO_MEAL) return true;
  return Object.values(sel.extras).some((q) => q > 0);
}

/** Next quantity for an extra, clamped to its cap (Extra Rice may not exceed 1 per plate). */
export function nextExtraQty(current: number, delta: number, max?: number): number {
  const next = current + delta;
  if (next < 0) return 0;
  return max === undefined ? next : Math.min(max, next);
}

/** Human-readable lines describing the selection, for cart, receipt and WhatsApp. */
export function describeSelection(product: Product, sel: Selection): string[] {
  const lines: string[] = [];
  if (product.meals) {
    const meal = product.meals.find((m) => m.id === sel.options["meal"]);
    if (meal) lines.push(meal.id === NO_MEAL ? meal.label : `${meal.label} (${formatNaira(meal.price)})`);
    for (const e of product.extras ?? []) {
      const qty = sel.extras[e.id] ?? 0;
      if (qty > 0) lines.push(`${qty} × ${e.label} (${formatNaira(e.price * qty)})`);
    }
  }
  for (const group of product.options ?? []) {
    const choice = group.choices.find((c) => c.id === sel.options[group.id]);
    if (choice) lines.push(`${group.label}: ${choice.label}`);
  }
  return lines;
}
