import { Plus } from "lucide-react";
import type { Product } from "@/data/menu";
import { PriceTag } from "@/components/PriceTag";
import { useStore } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const { openProduct } = useStore();

  return (
    <article className="card-surface group flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <button
        type="button"
        onClick={() => openProduct(product)}
        className="relative block aspect-4/3 w-full overflow-hidden"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream">
            {product.badge}
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-display text-lg font-semibold leading-tight sm:text-xl">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        {(product.serves || product.note) && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-gold">
            {product.serves ?? product.note}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 pt-1">
          <span className="inline-flex flex-wrap items-center gap-x-1 text-lg font-bold">{product.meals && <span className="text-xs font-medium text-muted-foreground">From </span>}<PriceTag price={product.price} wasPrice={product.wasPrice} /></span>
          <button
            type="button"
            onClick={() => openProduct(product)}
            disabled={!product.available}
            className="btn-primary min-h-11 px-4 py-2 text-xs active:scale-95"
          >
            {product.available ? (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add to Cart
              </>
            ) : (
              "Coming soon"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
