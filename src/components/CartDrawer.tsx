import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { useStore } from "@/lib/store";
import { usePresence } from "@/hooks/use-presence";
import { useScrollLock } from "@/hooks/use-scroll-lock";

export function CartDrawer() {
  const { cartOpen, setCartOpen, items, subtotal, setQuantity, removeItem } = useStore();

  const presence = usePresence(cartOpen);
  useScrollLock(cartOpen);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  if (!presence.rendered) return null;

  return (
    <div
      data-state={presence.state}
      className="glass-overlay fixed inset-0 z-[70]"
      onClick={() => setCartOpen(false)}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        onClick={(e) => e.stopPropagation()}
        className="drawer-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-2xl font-bold">Your Order</h2>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center rounded-full border border-border"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Your cart is empty. Browse the menu to start your order.
            </p>
            <Link to="/menu" onClick={() => setCartOpen(false)} className="btn-primary">
              View Menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    {(item.details?.length ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.details!.join(", ")}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-0.5 line-clamp-2 text-xs italic text-muted-foreground">
                        “{item.notes}”
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name}`}
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name}`}
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-muted"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.key)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-primary"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t safe-bottom px-5 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatNaira(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="text-muted-foreground">Confirmed at checkout</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="btn-primary mt-4 w-full"
              >
                Checkout · {formatNaira(subtotal)}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
