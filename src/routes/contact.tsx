import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { business } from "@/data/menu";
import { SocialLinks } from "@/components/SocialLinks";

const title = "Contact McRelish | Orders & Catering Enquiries";
const description =
  "Call +234 707 049 2039 or message McRelish for daily orders, bulk home orders and event catering in Awka, Anambra State.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

const inquiryTypes = [
  "Daily Order",
  "Bulk Home Order",
  "Catering",
  "General Inquiry",
  "Feedback",
];

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <section className="section-pad">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Contact us</p>
        <h1 className="mt-4 font-display text-5xl font-bold">Get in touch.</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Placing a daily order, planning a family weekend, or organizing a large
          event? Our team is ready to assist you.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-4">
            <li className="card-surface flex gap-3 p-5">
              <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Visit us</h2>
                <p className="text-sm text-muted-foreground">{business.city}</p>
              </div>
            </li>
            <li className="card-surface flex gap-3 p-5">
              <Phone className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Call us</h2>
                <a
                  href={business.phoneHref}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {business.phone}
                </a>
                <p className="text-sm text-muted-foreground">{business.hours}</p>
              </div>
            </li>
            <li className="card-surface flex gap-3 p-5">
              <Mail className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Email us</h2>
                <a
                  href={`mailto:${business.email}`}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {business.email}
                </a>
              </div>
            </li>
            <li className="card-surface p-5">
              <h2 className="font-semibold">Follow us</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                See what&apos;s cooking today, new dishes and event highlights.
              </p>
              <SocialLinks
                className="mt-3"
                linkClassName="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
              />
            </li>
          </ul>

          <div className="card-surface p-6 lg:p-8">
            <h2 className="font-display text-3xl font-bold">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Have a question or special request? Fill out the form and our team will
              get back to you.
            </p>

            {sent ? (
              <div
                role="status"
                className="mt-6 rounded-2xl border border-border bg-accent p-5 text-sm text-accent-foreground"
              >
                <p className="font-semibold">Thanks — your message is ready to send.</p>
                <p className="mt-1">
                  This form is not yet connected to McRelish&apos;s inbox, so please
                  call{" "}
                  <a href={business.phoneHref} className="underline">
                    {business.phone}
                  </a>{" "}
                  or email{" "}
                  <a href={`mailto:${business.email}`} className="underline">
                    {business.email}
                  </a>{" "}
                  to reach the team right away.
                </p>
              </div>
            ) : (
              <form
                className="mt-6 grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <Field id="name" label="Your name" required />
                <Field id="email" label="Email address" type="email" required />
                <Field id="phone" label="Phone number" type="tel" required />
                <div>
                  <label htmlFor="inquiry" className="text-sm font-medium">
                    Inquiry type
                  </label>
                  <select
                    id="inquiry"
                    required
                    defaultValue=""
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="" disabled>
                      Select inquiry type
                    </option>
                    {inquiryTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                    placeholder="For catering and bulk orders, include guest count, date, location and any dietary requirements."
                  />
                </div>
                <button type="submit" className="btn-primary sm:col-span-2">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
      />
    </div>
  );
}
