import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import cateringImg from "@/assets/catering.jpg";
import { useStore } from '@/lib/store';

export function CategoryNav() {
  const { catalog } = useStore();
  const tiles = [...catalog.sections, { id: 'catering', label: 'Catering', tagline: 'Weddings, corporate & large gatherings', image: cateringImg }];
  return (
    <section className="bg-cream pt-10 pb-14 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="categories-heading" className="mt-3 text-[2rem] font-bold leading-tight sm:text-4xl">
              What are you ordering today?
            </h2>
          </div>
          <Link to="/menu" className="btn-outline hidden md:inline-flex">
            Full menu
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <Link
                to="/menu"
                hash={tile.id}
                className="card-surface group block h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={tile.image}
                    alt={tile.label}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-display text-lg font-semibold leading-tight sm:text-xl">{tile.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{tile.tagline}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 block md:hidden">
          <Link to="/menu" className="btn-outline flex w-full items-center justify-center py-4 text-center">
            Full menu
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
