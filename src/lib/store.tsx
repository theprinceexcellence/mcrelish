import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "@/data/menu";
import { useSuspenseQuery } from '@tanstack/react-query';
import { catalogQuery } from './catalog-query';
import type { Catalog } from './catalog';
import { CART_STORAGE_KEY, cartKey, restoreCart } from "@/lib/cart-storage";
import { describeSelection, priceFor } from "@/lib/customize";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  options: Record<string, string>;
  extras?: Record<string, number>;
  details?: string[];
  notes?: string | undefined;
};

type StoreValue = {
  catalog: Catalog;
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (
    product: Product,
    opts?: {
      quantity?: number;
      options?: Record<string, string>;
      extras?: Record<string, number>;
      notes?: string | undefined;
    },
  ) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  activeProduct: Product | null;
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  hydrated: boolean;
  storageError: boolean;
  catalogVersion: number;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: catalog, dataUpdatedAt } = useSuspenseQuery(catalogQuery);
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      setItems(restoreCart(localStorage.getItem(CART_STORAGE_KEY), catalog.products));
    } catch {
      setStorageError(true);
    }
    setHydrated(true);
  }, [catalog]);

  const catalogVersion = dataUpdatedAt;

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [items, hydrated]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === CART_STORAGE_KEY || event.key === null)) setItems(restoreCart(event.newValue, catalog.products));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [catalog]);

  const addItem = useCallback<StoreValue["addItem"]>((product, opts) => {
    const options = opts?.options ?? {};
    const quantity = Math.max(1, Math.floor(opts?.quantity ?? 1));
    const extras = Object.fromEntries(Object.entries(opts?.extras ?? {}).filter(([, q]) => q > 0));
    const sel = { options, extras };
    const key = cartKey(product.id, options, opts?.notes, extras);
    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity, notes: opts?.notes ?? item.notes }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: priceFor(product, sel),
          image: product.image,
          quantity,
          options,
          extras,
          details: describeSelection(product, sel),
          notes: opts?.notes,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.key !== key)
        : prev.map((item) => (item.key === key ? { ...item, quantity } : item)),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<StoreValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      catalog,
      items,
      count,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      cartOpen,
      setCartOpen,
      activeProduct,
      openProduct: setActiveProduct,
      closeProduct: () => setActiveProduct(null),
      hydrated,
      storageError,
      catalogVersion,
    };
  }, [catalog, items, addItem, setQuantity, removeItem, clearCart, cartOpen, activeProduct, hydrated, storageError, catalogVersion]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
