import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-jollof.jpg";
import { PriceTag } from "@/components/PriceTag";
import { discountPercent } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useHeroPromo } from "@/lib/promo";

export function Hero() {
  const { openProduct, catalog } = useStore();
  const { promo, flyerUrl } = useHeroPromo();
  const product = catalog.products.find(p => p.id === promo.product_id);
  const show = promo.active && product && product.available;
  const image = flyerUrl ?? product?.image;
  const discount = product ? discountPercent(product.price, product.wasPrice) : 0;

  return (
    <section className="relative flex min-h-[calc(100dvh-4.25rem)] flex-col justify-center overflow-hidden bg-ink text-cream sm:min-h-0">
      <img
        src={heroImage}
        alt=""
        width={1536}
        height={1152}
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-ink/30" />
      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:pt-16 sm:pb-14 lg:grid-cols-[1.25fr_1fr] lg:px-8 lg:pt-20 lg:pb-20">
        <div className="min-w-0">
          <p className="eyebrow border-cream/20 bg-cream/10 text-cream">Est. 2020 · Awka, Nigeria</p>
          <h1 className="mt-5 max-w-3xl font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Good food.
            <br />
            Great moments.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cream/80 sm:mt-5 sm:text-lg">
            Delicious meals prepared fresh and served with care. From daily orders to full event catering, we deliver
            quality you can trust.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Link to="/menu" className="btn-primary px-5 py-3.5 text-[15px] sm:px-7 sm:text-base">
              Order Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/menu"
              hash="menu-preview"
              className="btn-base border border-cream/30 px-5 py-3.5 text-[15px] sm:px-7 sm:text-base text-cream hover:bg-cream/10"
            >
              View Menu
            </Link>
          </div>

          {/* Mobile: compact campaign card */}
          {show && (
            <button
              type="button"
              onClick={() => openProduct(product)}
              className="mt-9 flex w-full items-center gap-3 rounded-2xl active:scale-[0.99] border border-cream/15 bg-cream/10 p-3 text-left backdrop-blur transition-colors hover:bg-cream/15 lg:hidden"
            >
              <span className="relative shrink-0">
                <img
                  src={image}
                  alt=""
                  width={1024}
                  height={1280}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                {discount > 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-md">
                    {discount}% OFF
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {promo.label}
                </span>
                <span className="block font-display text-lg font-semibold leading-tight">{promo.title}</span>
                <span className="mt-0.5 block truncate text-xs text-cream/70">{promo.subtitle}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                <PriceTag className="min-w-0 justify-end text-base font-bold" price={product.price} wasPrice={product.wasPrice} showBadge={false} />
                <span className="btn-primary px-3 py-1.5 text-xs">Order</span>
              </span>
            </button>
          )}
        </div>

        {/* Desktop: campaign flyer on the right */}
        {show && (
          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border border-cream/15 shadow-2xl">
              <img
                src={image}
                alt={`${promo.title}: ${product.description}`}
                width={1024}
                height={1280}
                className="aspect-[4/5] w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                {promo.label}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink via-ink/85 to-transparent p-5 pt-16">
                <p className="font-display text-2xl font-bold">{promo.title}</p>
                <p className="mt-1 text-sm text-cream/75">{promo.subtitle}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <PriceTag className="text-2xl font-bold" price={product.price} wasPrice={product.wasPrice} />
                  <button
                    type="button"
                    onClick={() => openProduct(product)}
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    Order {promo.title}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
