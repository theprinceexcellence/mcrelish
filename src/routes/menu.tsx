import { Link, createFileRoute } from "@tanstack/react-router";
import { cateringImage, cateringMenu } from "@/data/menu";
import { MenuBrowser } from "@/components/MenuBrowser";

const title = "Menu | McRelish Awka";
const description =
  "Browse the full McRelish menu: daily meals, bulk home orders, curated gift food boxes and a complete African catering menu.";

export const Route = createFileRoute("/menu")({
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
  component: MenuPage,
});

function MenuPage() {
  return (
    <>
      <section className="bg-ink px-4 py-10 text-cream sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow hidden border-cream/20 bg-cream/10 text-cream sm:inline-flex">Delicious offerings</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl lg:text-6xl">Explore our menu</h1>
          <p className="mt-2 max-w-2xl text-sm text-cream/75 sm:mt-3 sm:text-base">
            Carefully curated African dishes for daily meals, weekend family orders, gift boxes, and events.
          </p>
        </div>
      </section>

      <MenuBrowser extraTabs={[{ id: "catering", label: "Catering" }]} />

      <section id="catering" className="section-pad scroll-mt-32 bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow border-cream/20 bg-cream/10 text-cream">Weddings, corporate & large gatherings</p>
              <h2 className="mt-4 text-4xl font-bold">Catering services</h2>
              <p className="mt-3 text-sm text-cream/75">
                McRelish delivers complete African menus structured for quality, presentation, and timely service.
                Catering is priced by quotation based on your guest count and menu.
              </p>
              <img
                src={cateringImage}
                alt="McRelish event catering buffet with jollof rice, fried rice, peppered chicken and salads"
                loading="lazy"
                width={1536}
                height={1024}
                className="mt-6 aspect-3/2 w-full rounded-3xl object-cover"
              />
              <Link to="/contact" className="btn-primary mt-6">
                Request a catering quote
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {cateringMenu.map((group) => (
                <div key={group.group} className="rounded-2xl border border-cream/15 bg-cream/5 p-5">
                  <h3 className="font-display text-xl font-semibold">{group.group}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-cream/70">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
