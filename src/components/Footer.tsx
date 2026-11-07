import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Mail, MapPin, Phone } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";

function FooterSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cream/10 md:border-0">
      <h2 className="text-sm font-semibold">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between py-4 text-left md:pointer-events-none md:py-0"
        >
          {title}
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 md:hidden ${open ? "rotate-180" : ""}`} />
        </button>
      </h2>
      <div className="collapse-grid" data-open={open}>
        <div className="min-h-0 overflow-hidden"><div className="pb-4 md:pb-0">{children}</div></div>
      </div>
    </div>
  );
}
import { business } from "@/data/menu";

export function Footer() {
  return (
    <footer className="border-t bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-0 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
          <div>
            <span className="font-display text-2xl font-bold">
              Mc<span className="text-primary">Relish</span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-cream/70">
              {business.description}
            </p>
            <p className="mb-6 mt-4 text-xs uppercase tracking-[0.14em] text-cream/50 md:mb-0">
              Est. {business.founded} · Awka, Nigeria
            </p>
          </div>

          <FooterSection title="Order">
          <nav aria-label="Order">
            <ul className="md:mt-4 space-y-2 text-sm text-cream/70">
              <li>
                <Link to="/menu" className="hover:text-cream">
                  View Menu
                </Link>
              </li>
              <li>
                <Link to="/menu" hash="bulk" className="hover:text-cream">
                  Bulk Home Orders
                </Link>
              </li>
              <li>
                <Link to="/menu" hash="boxes" className="hover:text-cream">
                  Gift Food Boxes
                </Link>
              </li>
              <li>
                <Link to="/menu" hash="catering" className="hover:text-cream">
                  Catering Services
                </Link>
              </li>
              <li>
                <Link to="/deals" className="hover:text-cream">
                  Deals & Offers
                </Link>
              </li>
            </ul>
          </nav>
          </FooterSection>

          <FooterSection title="Company">
          <nav aria-label="Company">
            <ul className="md:mt-4 space-y-2 text-sm text-cream/70">
              <li>
                <Link to="/about" className="hover:text-cream">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-cream">
                  Locations
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cream">
                  Contact & Support
                </Link>
              </li>
              <li>
                <a href={business.phoneHref} className="hover:text-cream">
                  Customer Support
                </a>
              </li>
            </ul>
          </nav>
          </FooterSection>

          <FooterSection title="Get in touch">
          <div>
            <ul className="md:mt-4 space-y-3 text-sm text-cream/70">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{business.city}</span>
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={business.phoneHref} className="hover:text-cream">
                  {business.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${business.email}`} className="hover:text-cream">
                  {business.email}
                </a>
              </li>
              <li className="text-cream/50">{business.hours}</li>
            </ul>
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.14em] text-cream/50">Follow us</p>
              <SocialLinks className="mt-3" />
            </div>
          </div>
          </FooterSection>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} McRelish. All rights reserved.</p>
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link to="/terms" className="hover:text-cream">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-cream">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
