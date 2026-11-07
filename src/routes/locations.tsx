import { createFileRoute } from "@tanstack/react-router";
import { LocationSection } from "@/components/LocationSection";
import { OrderCta } from "@/components/OrderCta";

const title = "Locations | McRelish Awka Food Hub";
const description =
  "Find McRelish in Awka, Anambra State. Opening hours, phone number and directions for our food hubs.";

export const Route = createFileRoute("/locations")({
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
  component: LocationsPage,
});

function LocationsPage() {
  return (
    <>
      <section className="px-4 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Visit us</p>
          <h1 className="mt-4 font-display text-5xl font-bold">Our locations</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            McRelish operates from Awka, Anambra State. Walk in, order for pickup, or
            call us to arrange delivery.
          </p>
        </div>
      </section>
      <LocationSection />
      <OrderCta />
    </>
  );
}
