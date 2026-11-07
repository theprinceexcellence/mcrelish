import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { business, locations } from "@/data/menu";

export function LocationSection() {
  return (
    <section className="section-pad" aria-labelledby="locations-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Find us</p>
        <h2 id="locations-heading" className="mt-3 text-4xl font-bold">
          Order from your nearest food hub
        </h2>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {locations.map((loc) => (
            <article key={loc.id} className="card-surface p-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h3 className="truncate font-display text-2xl font-semibold">
                  {loc.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    loc.open
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {loc.status}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {loc.address}
                </li>
                <li className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {loc.hours}
                </li>
                <li className="flex gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <a href={business.phoneHref} className="hover:text-primary">
                    {loc.phone}
                  </a>
                </li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/menu" className="btn-primary px-5 py-2.5 text-xs">
                  Order Now
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `McRelish ${loc.address}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline px-5 py-2.5 text-xs"
                >
                  Open in Maps
                </a>
              </div>
              {!loc.open && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Exact street address and opening hours to be confirmed by McRelish.
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
