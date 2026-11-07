import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { usePresence } from "@/hooks/use-presence";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { discountPercent, formatNaira } from "@/lib/format";
import { usePreloaderDone } from "@/lib/preloader";
import { useHeroPromo } from "@/lib/promo";
import { useStore } from "@/lib/store";

// Counts down to 9 November 2026, Lagos time.
const TARGET = Date.parse("2026-11-09T00:00:00+01:00");
const PAGES = new Set(["/", "/menu", "/deals", "/locations", "/about", "/contact"]);

function remaining(now: number) {
  const seconds = Math.floor(Math.max(0, TARGET - now) / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

export function PromoModal() {
  const { catalog, addItem, hydrated } = useStore();
  const { promo, flyerUrl } = useHeroPromo();
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const preloaderDone = usePreloaderDone();
  const product = catalog.products.find((p) => p.id === promo.product_id);
  const [now, setNow] = useState(() => Date.now());
  const [armed, setArmed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const open =
    armed &&
    hydrated &&
    PAGES.has(path) &&
    promo.active &&
    Boolean(product?.available) &&
    now < TARGET;
  const presence = usePresence(open);
  useScrollLock(open);

  useEffect(() => {
    if (!preloaderDone) return;
    const id = window.setTimeout(() => {
      setNow(Date.now());
      setArmed(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [preloaderDone]);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    ctaRef.current?.focus({ preventScroll: true });
    return () => window.clearInterval(id);
  }, [open]);

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
    const first = focusable?.[0];
    const lastItem = focusable?.[focusable.length - 1];
    if (!first || !lastItem) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!presence.rendered || !product) return null;

  const left = remaining(now);
  const percent = discountPercent(product.price, product.wasPrice);
  const items = promo.subtitle
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  const units = [
    { label: "Days", value: left.days },
    { label: "Hours", value: left.hours },
    { label: "Min", value: left.minutes },
    { label: "Sec", value: left.seconds },
  ];

  return (
    <div
      data-state={presence.state}
      className="sheet-overlay fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jolly-modal-title"
        onKeyDown={trapFocus}
        className="sheet-in relative flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-primary text-primary-foreground shadow-2xl sm:rounded-3xl"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.22) 1.5px, transparent 2px), radial-gradient(circle, rgba(255,214,102,0.28) 2px, transparent 2.5px)",
            backgroundSize: "26px 26px, 38px 38px",
            backgroundPosition: "0 0, 13px 19px",
          }}
        />

        <div className="relative overflow-y-auto">
          <div className="relative aspect-[16/10] w-full">
            <img
              src={flyerUrl ?? product.image}
              alt={`${promo.title}: ${product.description}`}
              className="size-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-primary via-primary/15 to-transparent"
            />
            {percent > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-4 top-4 grid size-[4.5rem] rotate-12 place-items-center rounded-full bg-gold text-center font-sans text-2xl font-extrabold leading-[0.95] text-gold-foreground shadow-lg ring-4 ring-primary/40"
              >
                <span>
                  {percent}%<span className="block text-sm tracking-wide">OFF</span>
                </span>
              </span>
            )}
          </div>

          <div className="relative -mt-8 px-6 pb-6 text-center">
            <span className="inline-block rounded-full bg-gold px-4 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-foreground shadow-md">
              {promo.label}
            </span>
            <h2
              id="jolly-modal-title"
              className="mt-3 font-display text-[2.6rem] font-bold leading-none"
            >
              {promo.title}
            </h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="What's included">
              {items.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium"
                >
                  {item}
                </li>
              ))}
            </ul>
            <PriceTag
              className="mt-4 justify-center text-3xl font-bold"
              price={product.price}
              wasPrice={product.wasPrice}
              showBadge={false}
            />

            <div className="mt-5 rounded-2xl bg-ink/30 px-3 pb-3 pt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/85">
                Counting down to 9 November
              </p>
              <div
                role="timer"
                aria-label="Time left until 9 November"
                className="mt-3 grid grid-cols-4 gap-2"
              >
                {units.map((unit) => (
                  <div key={unit.label} className="rounded-xl bg-white/10 py-2">
                    <p className="font-sans text-3xl font-extrabold leading-none tabular-nums text-gold">
                      {pad(unit.value)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-cream/70">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-ink/30 p-1">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-40"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <span
                  className="w-8 text-center text-base font-bold tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 10}
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-40"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
              <button
                ref={ctaRef}
                type="button"
                onClick={() => {
                  addItem(product, { quantity });
                  void navigate({ to: "/checkout" });
                }}
                className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full bg-gold px-5 py-3.5 text-base font-bold text-gold-foreground shadow-lg transition hover:brightness-105 focus-visible:outline-cream active:scale-[0.98]"
              >
                Order · {formatNaira(product.price * quantity)}
              </button>
            </div>
            <p className="mt-3 text-xs text-cream/70">Tap order to go straight to checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
