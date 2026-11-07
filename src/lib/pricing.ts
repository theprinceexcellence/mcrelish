import type { Product } from "@/data/menu";

/** Admin-editable price row. Keys: p:<product>, m:<product>:<meal>, e:<product>:<extra>, s:<product>:<extra> (on-its-own price). */
export type PriceRow = { key: string; price: number; available: boolean };
export type PriceMap = Map<string, PriceRow>;

export const toPriceMap = (rows: PriceRow[]): PriceMap => new Map(rows.map((r) => [r.key, r]));

/** A copy of the product with database prices and availability applied. Unknown keys keep catalog values. */
export function pricedProduct(product: Product, map: PriceMap): Product {
  const base = map.get(`p:${product.id}`);
  const meals = product.meals
    ?.map((m) => {
      const row = map.get(`m:${product.id}:${m.id}`);
      return row ? { ...m, price: row.price, available: row.available } : { ...m, available: true };
    })
    .filter((m) => m.available)
    .map(({ available: _a, ...m }) => m);
  const extras = product.extras
    ?.map((e) => {
      const row = map.get(`e:${product.id}:${e.id}`);
      const solo = map.get(`s:${product.id}:${e.id}`);
      return {
        ...e,
        price: row?.price ?? e.price,
        ...(e.soloPrice !== undefined ? { soloPrice: solo?.price ?? e.soloPrice } : {}),
        available: row?.available ?? true,
      };
    })
    .filter((e) => e.available)
    .map(({ available: _a, ...e }) => e);
  return {
    ...product,
    price: base?.price ?? product.price,
    available: base?.available ?? product.available,
    ...(meals ? { meals } : {}),
    ...(extras ? { extras } : {}),
  };
}

/** Browser-only: update the shared catalog in place so every menu card shows the latest admin prices. */
export function applyPriceMap(catalog: Product[], map: PriceMap) {
  for (let i = 0; i < catalog.length; i++) {
    const original = originals.get(catalog[i]!.id) ?? structuredCloneProduct(catalog[i]!);
    originals.set(original.id, original);
    Object.assign(catalog[i]!, pricedProduct(original, map));
  }
}

const originals = new Map<string, Product>();
const structuredCloneProduct = (p: Product): Product => ({
  ...p,
  ...(p.meals ? { meals: p.meals.map((m) => ({ ...m })) } : {}),
  ...(p.extras ? { extras: p.extras.map((e) => ({ ...e })) } : {}),
});
