import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { CategoryCircles } from "@/components/CategoryCircles";
import { ProductFeed } from "@/components/ProductFeed";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/")({
  // Old shared links like /?q=371 now open the search results page.
  beforeLoad: ({ search }) => {
    const q = (search as Record<string, unknown>)["q"];
    if (typeof q === "string" && q.trim()) {
      throw redirect({ to: "/browse", search: { q: q.slice(0, 120) } });
    }
  },
  head: () => ({
    meta: [
      { title: "Vettly – Tested picks from my reels" },
      {
        name: "description",
        content:
          "Vetted products. Real reviews. Watch every product tested in my Instagram reels, then grab the Amazon link.",
      },
      { property: "og:title", content: "Vettly – Tested picks from my reels" },
      {
        property: "og:description",
        content: "Vetted products. Real reviews. Watch the reel, then grab the link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteShell>
      <h1 className="sr-only">Vettly – Vetted products. Real reviews.</h1>
      <div className="mt-6">
        <BannerCarousel />
      </div>
      <CategoryCircles />
      <section aria-labelledby="latest-reels" className="mt-10">
        <div className="mx-auto mb-4 flex max-w-[420px] items-center justify-between gap-3">
          <h2 id="latest-reels" className="text-lg font-bold sm:text-xl">
            Latest reels
          </h2>
          <Link
            to="/browse"
            search={{ view: "reels" }}
            className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline"
          >
            See all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ProductFeed view="reels" layout="column" />
      </section>
    </SiteShell>
  );
}
