import { createFileRoute } from "@tanstack/react-router";
import { business } from "@/data/menu";

const title = "Terms of Service | McRelish";
const description =
  "Terms of service for ordering meals, bulk packs, food boxes and catering from McRelish.";

export const Route = createFileRoute("/terms")({
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
  component: TermsPage,
});

function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl font-bold">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p className="rounded-2xl border border-border bg-accent p-4 text-accent-foreground">
          Placeholder: McRelish has not published full terms of service. This page is
          a structure to be completed with the official wording from McRelish.
        </p>
        <p>
          Orders placed on this website are order requests. A McRelish team member
          confirms availability, pricing, delivery options and payment before
          preparation begins.
        </p>
        <p>
          Prices shown are the published menu prices at the time of ordering. Catering
          and custom menu planning are priced by formal quotation.
        </p>
        <p>
          For questions about an order, contact {business.phone} or {business.email}.
        </p>
      </div>
    </section>
  );
}
