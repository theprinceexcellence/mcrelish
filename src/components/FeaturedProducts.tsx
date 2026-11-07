import { useStore } from '@/lib/store';
import { ProductCard } from "./ProductCard";

const featuredIds = [
  "mcrelish-jollof",
  "family-jollof-pack",
  "classic-box",
  "coconut-rice-pack",
];

export function FeaturedProducts() {
  const { catalog: { products } } = useStore();
  const featured = featuredIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="section-pad" aria-labelledby="favourites-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Customer favourites</p>
        <h2 id="favourites-heading" className="mt-3 text-4xl font-bold">
          Popular picks
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Our most ordered meals, served fresh daily at our Awka Food Hub.
        </p>
      </div>

      <div className="no-scrollbar mt-8 flex gap-5 overflow-x-auto px-4 pb-2 sm:px-6 lg:mx-auto lg:max-w-7xl lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-8">
        {featured.map((product) => (
          <div key={product.id} className="w-[78vw] shrink-0 sm:w-[46vw] lg:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
