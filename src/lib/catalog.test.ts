import { describe, expect, it } from 'vitest';
import { buildCatalog, type MenuItem, type MenuSection } from './catalog';
import { priceOrder } from './order-pricing';
import { toPriceMap } from './pricing';
import { restoreCart } from './cart-storage';

const sections: MenuSection[] = [{ id: 'daily', name: 'Daily Meals', subtitle: 'Fresh meals', image_path: '', visible: true, sort_order: 1 }, { id: 'new', name: 'New section', subtitle: '', image_path: '', visible: true, sort_order: 0 }];
const items: MenuItem[] = [{ id: 'mcrelish-jollof', section_id: 'daily', name: 'McRelish Special Jollof', description: 'Updated', image_path: '', price: 1800, available: true, visible: true, sort_order: 1 }, { id: 'new-item', section_id: 'new', name: 'Test meal', description: 'Test only', image_path: 'photo.jpg', price: 5500, available: true, visible: true, sort_order: 0 }];
describe('managed menu', () => {
  it('orders sections by owner priority', () => { expect(buildCatalog(sections, items, []).sections.map(s => s.id)).toEqual(['new', 'daily']); });
  it('moves items into their chosen section', () => { expect(buildCatalog(sections, [{ ...items[0], id: 'mcrelish-jollof', section_id: 'new' } as MenuItem], []).products[0]?.category).toBe('new'); });
  it('uses uploaded images', () => { expect(buildCatalog(sections, items, [], { 'photo.jpg': 'https://example.com/photo.jpg' }).products[0]?.image).toBe('https://example.com/photo.jpg'); });
  it('preserves Jollof protein pricing and rice cap', () => {
    const catalog = buildCatalog(sections, items, []);
    expect(priceOrder([{ productId: 'mcrelish-jollof', quantity: 1, options: { meal: 'chicken' }, extras: { rice: 3 } }], toPriceMap([]), catalog.products).subtotal).toBe(4000);
  });
  it('prices a new item from the managed menu', () => {
    const catalog = buildCatalog(sections, items, []);
    expect(priceOrder([{ productId: 'new-item', quantity: 2, options: {}, extras: {} }], toPriceMap([]), catalog.products).subtotal).toBe(11000);
  });
  it('rehydrates new items from IDs rather than browser prices', () => {
    const catalog = buildCatalog(sections, items, []);
    expect(restoreCart(JSON.stringify([{ productId: 'new-item', quantity: 1, price: 1 }]), catalog.products)[0]?.price).toBe(5500);
  });
  it('prevents ordering from hidden sections', () => {
    const catalog = buildCatalog(sections.map(s => ({ ...s, visible: false })), items, []);
    expect(() => priceOrder([{ productId: 'new-item', quantity: 1, options: {}, extras: {} }], toPriceMap([]), catalog.products)).toThrow();
  });
  it('prevents ordering hidden items', () => { expect(buildCatalog(sections, items.map(i => ({ ...i, visible: false })), []).products).toEqual([]); });
  it('orders items by owner priority', () => { expect(buildCatalog(sections, items, []).products.map(i => i.id)).toEqual(['new-item','mcrelish-jollof']); });
});