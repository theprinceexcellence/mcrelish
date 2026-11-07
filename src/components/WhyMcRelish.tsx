import { ChefHat, Clock, Leaf, MapPin } from "lucide-react";

const reasons = [
  {
    icon: ChefHat,
    title: "Master chefs",
    body: "Our experienced kitchen team prepares every meal with precision and attention to detail, ensuring consistent taste and presentation.",
  },
  {
    icon: Leaf,
    title: "Quality ingredients",
    body: "We source only the finest, freshest ingredients from trusted suppliers to maintain exceptional quality in every plate served.",
  },
  {
    icon: Clock,
    title: "Reliable service",
    body: "From quick daily orders to large event catering, we are structured to deliver on time without compromising quality.",
  },
  {
    icon: MapPin,
    title: "Awka food hub",
    body: "Serving individuals, offices and major events from our food hub in Awka, with walk-in and pickup available.",
  },
];

export function WhyMcRelish() {
  return (
    <section className="section-pad bg-cream" aria-labelledby="why-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Why McRelish</p>
        <h2 id="why-heading" className="mt-3 max-w-2xl text-4xl font-bold">
          Culinary excellence, redefined
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every dish reflects our commitment to authentic taste, quality
          ingredients, and consistent service.
        </p>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, body }) => (
            <li key={title} className="card-surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-2xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
