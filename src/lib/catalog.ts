import { products as bundledProducts, categories as bundledSections, type Product } from '@/data/menu';
import placeholder from '@/assets/food-box.jpg';
import { pricedProduct, toPriceMap, type PriceRow } from '@/lib/pricing';

export type MenuSection = { id: string; name: string; subtitle: string; image_path: string; sort_order: number; visible: boolean };
export type MenuItem = { id: string; section_id: string; name: string; description: string; image_path: string; price: number; available: boolean; visible: boolean; sort_order: number };
export type Catalog = { products: Product[]; sections: { id: string; label: string; tagline: string; image: string }[] };

export function buildCatalog(sections: MenuSection[], items: MenuItem[], prices: PriceRow[], images: Record<string, string> = {}): Catalog {
  const visibleSections = sections.filter(s => s.visible).sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const map = toPriceMap(prices);
  const products = items.filter(i => i.visible && visibleSections.some(s => s.id === i.section_id))
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map(item => {
      const bundled = bundledProducts.find(p => p.id === item.id);
      const base: Product = { ...(bundled ?? {}), id: item.id, name: item.name, description: item.description,
        category: item.section_id, price: item.price, available: item.available,
        image: images[item.image_path] ?? bundled?.image ?? placeholder, };
      const priced = pricedProduct(base, map);
      if (item.available && priced.note === 'Coming soon') delete priced.note;
      return { ...priced, price: item.price, available: item.available };
    });
  return { products, sections: visibleSections.map(section => ({ id: section.id, label: section.name, tagline: section.subtitle,
    image: images[section.image_path] ?? bundledSections.find(s => s.id === section.id)?.image ?? products.find(p => p.category === section.id)?.image ?? placeholder })) };
}