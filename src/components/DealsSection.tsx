import { Link } from "@tanstack/react-router";
import { formatNaira } from "@/lib/format";
import { useStore } from "@/lib/store";

const dealIds = ["family-jollof-pack", "celebration-box", "coconut-rice-pack"];

export function DealsSection() {
  const { openProduct, catalog } = useStore();
  const deals = dealIds
    .map((id) => catalog.products.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="section-pad bg-ink text-cream" aria-labelledby="deals-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow border-cream/20 bg-cream/10 text-cream">Value packs</p>
        <h2 id="deals-heading" className="mt-3 text-4xl font-bold">
          Packs & boxes worth sharing
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-cream/70">
          These are our best-value multi-serving packs, priced exactly as listed on
          our menu.
        </p>

        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {deals.map((deal) => (
            <li
              key={deal.id}
              className="group overflow-hidden rounded-3xl border border-cream/15 bg-cream/5"
            >
              <div className="aspect-16/10 overflow-hidden">
                <img
                  src={deal.image}
                  alt={deal.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-2xl font-semibold">{deal.name}</h3>
                <p className="mt-1 text-sm text-cream/70">{deal.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xl font-bold">{formatNaira(deal.price)}</span>
                  <button
                    type="button"
                    onClick={() => openProduct(deal)}
                    className="btn-primary px-5 py-2 text-xs"
                  >
                    Order Deal
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          to="/menu"
          className="btn-base mt-8 border border-cream/30 px-6 py-3 text-cream hover:bg-cream/10"
        >
          See the full menu
        </Link>
      </div>
    </section>
  );
}
