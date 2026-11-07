import { useEffect, useRef, useState } from "react";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { PriceTag } from "@/components/PriceTag";
import { useStore } from "@/lib/store";
import { nextExtraQty, priceFor } from "@/lib/customize";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { usePresence } from "@/hooks/use-presence";

const PROTEIN_LABEL: Record<string, string> = {
  egg: "Egg",
  beef: "Beef",
  chicken: "Chicken",
  turkey: "Turkey",
  "jumbo-turkey": "Jumbo Turkey",
  "no-protein": "Rice only",
};
const NO_PROTEIN = "no-protein";
const NO_MEAL = "none";

export function ProductModal() {
  const { activeProduct, closeProduct, addItem } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  const presence = usePresence(activeProduct);

  useEffect(() => {
    if (!activeProduct) return;
    setQuantity(1);
    setNotes("");
    setExtras({});
    setOpenGroups({});
    setOptions(() => {
      const initial = Object.fromEntries(
        (activeProduct.options ?? []).map((group) => [group.id, group.choices[0]!.id]),
      );
      if (activeProduct.meals) {
        // Open ready to order: Chicken by default when offered, otherwise the first real protein.
        const preferred =
          activeProduct.meals.find((m) => m.id === "chicken") ??
          activeProduct.meals.find((m) => m.id !== NO_MEAL && m.id !== NO_PROTEIN) ??
          activeProduct.meals[0]!;
        initial["meal"] = preferred.id;
      }
      return initial;
    });
    closeRef.current?.focus({ preventScroll: true });
  }, [activeProduct]);

  useEffect(() => {
    if (!activeProduct) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeProduct();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeProduct, closeProduct]);

  useScrollLock(Boolean(activeProduct));

  if (!presence.rendered) return null;
  const product = presence.rendered;
  const meals = product.meals;
  const sel = { options, extras };
  const unitPrice = priceFor(product, sel);
  const bump = (id: string, d: number, max?: number) =>
    setExtras((prev) => ({ ...prev, [id]: nextExtraQty(prev[id] ?? 0, d, max) }));

  const proteinChoices = (meals ?? []).filter((m) => m.id !== NO_MEAL);
  const extraGroups = (["Extras", "Sides"] as const).map((groupName) => ({
    groupName,
    list: (product.extras ?? []).filter((e) => e.group === groupName),
  })).filter((g) => g.list.length > 0);

  return (
    <div
      data-state={presence.state}
      className="sheet-overlay fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={closeProduct}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="sheet-in glass-sheet flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] transition-[scale] duration-100 active:scale-[0.99] sm:rounded-2xl"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="grid sm:grid-cols-2">
            <div className="relative aspect-4/3 sm:aspect-auto sm:min-h-full">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover sm:absolute sm:inset-0 sm:rounded-l-3xl"
              />
              <button
                ref={closeRef}
                type="button"
                onClick={closeProduct}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground sm:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative p-4 sm:p-7">
              <button
                type="button"
                onClick={closeProduct}
                aria-label="Close"
                className="absolute right-4 top-4 hidden h-9 w-9 place-items-center rounded-full border border-border sm:grid"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 id="product-modal-title" className="pr-10 font-display text-2xl font-bold leading-tight sm:text-3xl">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
              {product.serves && (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  {product.serves}
                </p>
              )}
              {product.note && (
                <p className="mt-1 text-xs text-muted-foreground">{product.note}</p>
              )}
              <p className="mt-4 text-2xl font-bold">
                <PriceTag price={unitPrice} wasPrice={product.wasPrice} />
              </p>

              {meals && (
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Choose your protein</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {proteinChoices.map((meal) => {
                      const selected = options["meal"] === meal.id;
                      return (
                        <button
                          key={meal.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setOptions((prev) => ({ ...prev, meal: meal.id }))}
                          className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card hover:border-primary"
                          }`}
                        >
                          <span className="block text-sm font-semibold">
                            {PROTEIN_LABEL[meal.id] ?? meal.label}
                          </span>
                          <span className={`block text-xs ${selected ? "opacity-80" : "text-muted-foreground"}`}>
                            {formatNaira(meal.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {extraGroups.length > 0 && (
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">
                    Extras &amp; sides <span className="text-muted-foreground">(optional)</span>
                  </legend>
                  {extraGroups.map(({ groupName, list }) => (
                    <div key={groupName} className="mt-2">
                      {(() => {
                        const picked = list.reduce((n, e) => n + (extras[e.id] ?? 0), 0);
                        const open = !!openGroups[groupName];
                        return (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenGroups((g) => ({ ...g, [groupName]: !g[groupName] }))}
                            className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left md:pointer-events-none md:border-0 md:px-0 md:py-1"
                          >
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {groupName}
                              {picked > 0 && (
                                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                                  {picked} added
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className={`h-4 w-4 transition-transform duration-300 md:hidden ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        );
                      })()}
                      <div className="collapse-grid" data-open={!!openGroups[groupName]}>
                      <div className="min-h-0 overflow-hidden">
                      <ul className="mt-1 divide-y divide-border rounded-xl border border-border">
                        {list.map((e) => {
                          const qty = extras[e.id] ?? 0;
                          const active = qty > 0;
                          const capped = e.max !== undefined && qty >= e.max;
                          return (
                            <li
                              key={e.id}
                              className={`flex items-center justify-between gap-3 px-4 py-2 text-sm transition-colors ${
                                active ? "bg-primary/5" : ""
                              }`}
                            >
                              <span>
                                {e.label}
                                <span className="ml-2 text-muted-foreground">
                                  +{formatNaira(e.price)}
                                </span>
                                {capped && (
                                  <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                                    Max {e.max} per plate
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => bump(e.id, -1, e.max)}
                                  disabled={qty === 0}
                                  aria-label={`Remove one ${e.label}`}
                                  className="grid h-8 w-8 place-items-center rounded-full border border-border disabled:opacity-40"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span
                                  aria-live="polite"
                                  className={`w-6 text-center font-semibold ${active ? "text-primary" : ""}`}
                                >
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => bump(e.id, 1, e.max)}
                                  disabled={capped}
                                  aria-label={`Add one ${e.label}`}
                                  className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
                                    active
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border"
                                  } disabled:opacity-40`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      </div>
                      </div>
                    </div>
                  ))}
                </fieldset>
              )}

              <div className="mt-5">
                <label htmlFor="product-notes" className="text-sm font-semibold">
                  Special instructions <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="product-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. extra pepper, no coleslaw"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-card safe-bottom px-4 pt-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span aria-live="polite" className="w-8 text-center font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={!product.available}
              onClick={() => {
                addItem(product, { quantity, options, extras, notes: notes.trim() || undefined });
                closeProduct();
              }}
              className="btn-primary flex-1"
            >
              {product.available
                ? `Add ${quantity} · ${formatNaira(unitPrice * quantity)}`
                : "Coming soon"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
