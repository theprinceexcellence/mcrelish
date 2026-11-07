import { Link } from "@tanstack/react-router";

export function Logo({ tone = "ink" }: { tone?: "ink" | "cream" }) {
  return (
    <Link to="/" aria-label="McRelish home" className="flex shrink-0 items-center gap-2">
      <img src="/mcrelish-logo.png" alt="" aria-hidden="true" className="h-7 w-auto" draggable={false} />
      <span
        className={`font-display text-2xl font-bold leading-none tracking-tight ${
          tone === "cream" ? "text-cream" : "text-ink"
        }`}
      >
        Mc<span className="text-primary">Relish</span>
      </span>
    </Link>
  );
}
