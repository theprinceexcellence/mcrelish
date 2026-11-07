import { createFileRoute, Link } from "@tanstack/react-router";
import cateringImg from "@/assets/catering.jpg";
import { WhyMcRelish } from "@/components/WhyMcRelish";
import { business } from "@/data/menu";

const title = "About McRelish | African Food Brand in Awka";
const description =
  "McRelish has served quality African meals and professional event catering since 2020, from our food hub in Awka, Anambra State.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const doing = [
  "Stopping by after a long day at work",
  "Gifting a loved one something special",
  "Planning a gathering with friends",
  "Hosting a corporate event or conference",
  "Preparing for a family weekend celebration",
];

function AboutPage() {
  return (
    <>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold lg:text-6xl">
            Where African culinary heritage meets modern excellence.
          </h1>
        </div>
      </section>

      <section className="pb-4">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              McRelish is more than a food brand — we serve daily meals and
              professional event catering. We are a dependable answer to anyone
              craving a well-prepared, satisfying African meal made with care.
            </p>
            <p>
              Every dish we serve is created to bring comfort, joy, and a sense of
              home; whether you are refueling after a long day or sharing a meaningful
              moment with loved ones.
            </p>
            <p>
              Our journey began on campus, preparing on-demand meals for friends,
              course mates, and small gatherings. What started as a simple way to
              serve good food quickly became something bigger — a trusted food brand
              known for taste, consistency, and professionalism, with a food hub in
              Awka serving individuals, offices, and major events.
            </p>
            <p>
              From our signature jollof rice to full scale catering services, we focus
              on consistency, quality, and experience.
            </p>
          </div>
          <div>
            <img
              src={cateringImg}
              alt="A McRelish catering spread prepared for an event"
              loading="lazy"
              width={1536}
              height={1024}
              className="aspect-4/3 w-full rounded-3xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold">What we do today</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Through our food hubs, curated meal boxes, weekend bulk orders, and event
            catering, we make enjoying delicious, high-quality meals simple and
            accessible. Whether you are:
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doing.map((item) => (
              <li key={item} className="card-surface px-5 py-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
            From individual servings to large-scale weddings and corporate events, our
            operations are built on taste, hygiene, efficiency, and attention to
            detail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu" className="btn-primary px-6 py-3">
              View the menu
            </Link>
            <a href={business.phoneHref} className="btn-outline px-6 py-3">
              Call {business.phone}
            </a>
          </div>
        </div>
      </section>

      <WhyMcRelish />
    </>
  );
}
