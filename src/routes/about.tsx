import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About – Vettly" },
      { name: "description", content: "Vettly collects every product tested in my Instagram reels, with direct Amazon links." },
      { property: "og:title", content: "About – Vettly" },
      { property: "og:description", content: "Vetted products. Real reviews. Here's how Vettly works." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <article className="mx-auto mt-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold">About Vettly</h1>
        <p className="mt-2 text-lg text-gold">Vetted products. Real reviews.</p>
        <div className="mt-6 space-y-4 text-muted-foreground">
          <p>
            Every product on Vettly has been tried on camera in one of my Instagram reels. Each one gets an
            episode number, so if you saw "ep 21" in a reel you can search for it here and find it straight away.
          </p>
          <p>
            Watch the reel, then tap "Click here for your link" to open the product on Amazon. Pick your
            country under the search bar and the link opens the right Amazon store where one is available.
          </p>
          <p>
            Links are Amazon affiliate links — I may earn a small commission at no extra cost to you. As an
            Amazon Associate I earn from qualifying purchases.
          </p>
          <p>
            There are no accounts and no tracking. If you save products to My list, they stay in your own
            browser only.
          </p>
        </div>
        <Button asChild variant="gold" className="mt-8 rounded-full">
          <Link to="/browse">Browse all products</Link>
        </Button>
      </article>
    </SiteShell>
  );
}
