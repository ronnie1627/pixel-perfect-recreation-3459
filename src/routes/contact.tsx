import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/catalog";
import { isValidHttpUrl } from "@/lib/links";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact – Vettly" },
      { name: "description", content: "Questions about a product from my reels? Message me on Instagram." },
      { property: "og:title", content: "Contact – Vettly" },
      { property: "og:description", content: "Get in touch about a product from my reels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useQuery(settingsQuery);
  const instagram = data && isValidHttpUrl(data.instagram_url) ? data.instagram_url.trim() : "";
  return (
    <SiteShell>
      <article className="mx-auto mt-10 max-w-2xl">
        <h1 className="text-4xl font-extrabold">Contact</h1>
        <p className="mt-4 text-muted-foreground">
          Got a question about a product from one of my reels, or an idea for something I should test? The
          quickest way to reach me is a message on Instagram.
        </p>
        <p className="mt-4 text-muted-foreground">
          For orders, delivery or returns, please contact Amazon — every purchase is completed on Amazon.
        </p>
        {instagram && (
          <Button asChild variant="gold" className="mt-8 rounded-full">
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              Message me on Instagram
            </a>
          </Button>
        )}
      </article>
    </SiteShell>
  );
}
