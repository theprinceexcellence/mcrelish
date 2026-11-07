import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Product } from "@/data/menu";
import { PriceTag } from "@/components/PriceTag";
import { ProductGrid } from "./ProductGrid";

const NAV_OFFSET = 132; // sticky header + category bar

function MenuRow({ product }: { product: Product }) {
  const { openProduct } = useStore();
  return (
    <li>
      <button
        type="button"
        onClick={() => openProduct(product)}
        disabled={!product.available}
        className="flex w-full items-center gap-3 py-3.5 text-left disabled:opacity-60"
        aria-label={`View ${product.name}`}
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-tight">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{product.description}</p>
          <p className="mt-1.5 text-sm font-bold">
            {product.available ? (
              <>{product.meals && <span className="text-xs font-medium text-muted-foreground">From </span>}<PriceTag price={product.price} wasPrice={product.wasPrice} /></>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</span>
            )}
          </p>
        </div>
        <div className="relative h-24 w-24 shrink-0">
          <img src={product.image} alt="" loading="lazy" className="h-full w-full rounded-2xl object-cover" />
          {product.available && (
            <span className="absolute -bottom-1.5 -right-1.5 grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </button>
    </li>
  );
}

export function MenuBrowser({ extraTabs = [] }: { extraTabs?: { id: string; label: string }[] }) {
  const { catalog: { products, sections } } = useStore();
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const barRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(0);

  const groups = sections
    .map((s) => ({ ...s, items: products.filter((p) => p.category === s.id) }))
    .filter((g) => g.items.length > 0);
  const tabs = [...groups.map((g) => ({ id: g.id, label: g.label })), ...extraTabs];

  useEffect(() => {
    if (showAll) return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      if (Date.now() < lockRef.current) return;
      let current = tabs[0]?.id;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        // deadband: section must clear the bar by 24px to become active
        if (el && el.getBoundingClientRect().top - NAV_OFFSET - 24 <= 0) current = t.id;
      }
      if (current) setActive((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [showAll, tabs.map((t) => t.id).join()]);

  useEffect(() => {
    // Scroll only the horizontal bar — never the page — so it can't fight the user's vertical scroll.
    const bar = barRef.current;
    const btn = bar?.querySelector<HTMLElement>(`[data-tab="${showAll ? "all" : active}"]`);
    if (!bar || !btn) return;
    const target = btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active, showAll]);

  const jump = (id: string) => {
    setShowAll(false);
    setActive(id);
    lockRef.current = Date.now() + 700;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET + 4, behavior: "smooth" });
    });
  };

  const pill = (id: string, label: string, isActive: boolean, onClick: () => void) => (
    <button
      key={id}
      data-tab={id}
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${
        isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="sticky top-[4.25rem] z-40 border-b bg-background/90 backdrop-blur-xl">
        <nav
          ref={barRef}
          aria-label="Menu categories"
          className="no-scrollbar relative mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-8"
        >
          {pill("all", "All Items", showAll, () => { setShowAll(true); window.scrollTo({ top: 0, behavior: "smooth" }); })}
          {tabs.map((t) => pill(t.id, t.label, !showAll && active === t.id, () => jump(t.id)))}
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {showAll ? (
          <>
            <ul className="divide-y sm:hidden">{products.map((p) => <MenuRow key={p.id} product={p} />)}</ul>
            <div className="hidden sm:block"><ProductGrid products={products} /></div>
          </>
        ) : (
          groups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-36 pt-8 pb-8 first:pt-0 sm:pt-12 sm:pb-14 sm:first:pt-0">
              <h2 id={`${g.id}-h`} className="text-2xl font-bold sm:text-3xl">{g.label}</h2>
              {g.tagline && <p className="mt-1 text-sm text-muted-foreground">{g.tagline}</p>}
              <ul className="mt-2 divide-y sm:hidden">{g.items.map((p) => <MenuRow key={p.id} product={p} />)}</ul>
              <div className="mt-6 hidden sm:block"><ProductGrid products={g.items} /></div>
            </section>
          ))
        )}
      </div>

    </>
  );
}
