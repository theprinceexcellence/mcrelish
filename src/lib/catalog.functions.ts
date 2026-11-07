import { api, menuImageUrl } from "./api";
import { buildCatalog, type MenuItem, type MenuSection } from "./catalog";
import type { PriceRow } from "./pricing";

/** Loads the menu from the PHP backend and merges it with the site's own product details. */
export async function getCatalog() {
  const menu = await api<{ sections: MenuSection[]; items: MenuItem[]; prices: PriceRow[] }>("/api/menu");
  const images: Record<string, string> = {};
  for (const row of [...menu.items, ...menu.sections]) if (row.image_path) images[row.image_path] = menuImageUrl(row.image_path);
  return buildCatalog(menu.sections, menu.items, menu.prices, images);
}
