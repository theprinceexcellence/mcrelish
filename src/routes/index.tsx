import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";

const title = "McRelish | Order The Best Jollof In Awka";
const description =
  "Good food, great moments. Order McRelish jollof rice, family packs, gift food boxes and event catering in Awka, Anambra State.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <CategoryNav />
    </>
  );
}
