import type { Product } from "@/data/menu";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  emptyMessage = "No items match this category yet.",
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <p
        role="status"
        className="card-surface px-6 py-12 text-center text-sm text-muted-foreground"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
