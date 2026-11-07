import { Link } from "@tanstack/react-router";
import { ArrowRight, Phone } from "lucide-react";
import ctaImage from "@/assets/order-cta.jpg";
import { business } from "@/data/menu";

export function OrderCta() {
  return (
    <section className="section-pad bg-cream" aria-labelledby="order-cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="card-surface grid overflow-hidden lg:grid-cols-2">
          <div className="order-2 p-8 lg:order-1 lg:p-12">
            <p className="eyebrow">Online ordering</p>
            <h2 id="order-cta-heading" className="mt-4 text-4xl font-bold">
              Your next meal is just a few clicks away.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Browse the menu, choose your protein, add to cart and tell us whether
              you are picking up or having it delivered. Our team confirms every
              order by phone.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/menu" className="btn-primary px-6 py-3">
                Start Your Order
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={business.phoneHref} className="btn-outline px-6 py-3">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {business.phone}
              </a>
            </div>
          </div>
          <div className="order-1 min-h-64 lg:order-2">
            <img
              src={ctaImage}
              alt="A McRelish customer collecting a takeaway order at the food hub"
              loading="lazy"
              width={1200}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
