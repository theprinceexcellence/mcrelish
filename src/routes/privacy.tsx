import { createFileRoute } from "@tanstack/react-router";
import { business } from "@/data/menu";

const title = "Privacy Policy | McRelish";
const description =
  "How McRelish handles the contact and order details you share when ordering online.";

export const Route = createFileRoute("/privacy")({
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
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl font-bold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p className="rounded-2xl border border-border bg-accent p-4 text-accent-foreground">
          Placeholder: McRelish has not published a full privacy policy. This page is a
          structure to be completed with the official wording from McRelish.
        </p>
        <p>
          Your cart is stored only in your own browser. Details you enter at checkout
          — name, phone number, email and delivery address — are used solely to
          confirm and fulfil your order.
        </p>
        <p>
          To ask about the information McRelish holds about you, contact{" "}
          {business.email} or call {business.phone}.
        </p>
      </div>
    </section>
  );
}
