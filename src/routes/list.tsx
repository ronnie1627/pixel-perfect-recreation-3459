import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { Heart, Link2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { PhotoTile, PhotoTileSkeleton } from "@/components/PhotoTile";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { buildCartUrl } from "@/lib/cart";
import { DEFAULT_SETTINGS, settingsQuery } from "@/lib/catalog";
import { useShopCountry } from "@/lib/country";
import { addAllSaved, parseEpisodeList, removeSaved, shareListPath, useMyList } from "@/lib/my-list";
import { fetchProductsByEpisodes } from "@/lib/products";

type ListSearch = { items?: string | undefined };

export const Route = createFileRoute("/list")({
  validateSearch: (search: Record<string, unknown>): ListSearch => {
    const items = parseEpisodeList(search["items"]);
    return { items: items.length ? items.join(",") : undefined };
  },
  head: () => ({
    meta: [
      { title: "My list – Vettly" },
      { name: "description", content: "Products you saved on Vettly, with their Amazon links. Saved only in your browser." },
      { property: "og:title", content: "My list – Vettly" },
      { property: "og:description", content: "A list of tested products with direct Amazon links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListPage,
});

function ListPage() {
  const { items } = Route.useSearch();
  const shared = parseEpisodeList(items);
  const saved = useMyList();
  const hydrated = useHydrated();
  const isShared = shared.length > 0;
  const episodes = isShared ? shared : saved;

  const products = useQuery({
    queryKey: ["products", "list", episodes.join(",")],
    queryFn: () => fetchProductsByEpisodes(episodes),
    enabled: hydrated,
  });
  const { data: settings = DEFAULT_SETTINGS } = useQuery(settingsQuery);
  const country = useShopCountry();
  const rows = products.data ?? [];
  const cartUrl = buildCartUrl(country, rows, settings);
  const loading = !hydrated || (episodes.length > 0 && products.isPending);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${shareListPath(saved)}`);
      toast.success("Link to your list copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <SiteShell>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{isShared ? "Shared list" : "My list"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isShared
              ? "Someone shared these picks with you."
              : "Saved only in this browser — no account, nothing sent anywhere."}
          </p>
        </div>
        {isShared ? (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              addAllSaved(rows.map((r) => r.episode));
              toast.success("Added to My list");
            }}
            disabled={rows.length === 0}
          >
            <Heart aria-hidden="true" /> Save all to My list
          </Button>
        ) : (
          saved.length > 0 && (
            <Button variant="outline" className="rounded-full" onClick={copyShareLink}>
              <Link2 aria-hidden="true" /> Share my list
            </Button>
          )
        )}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <PhotoTileSkeleton key={i} />
          ))}
        </div>
      ) : products.isError ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">Couldn't load your list.</p>
          <Button variant="outline" className="mt-4" onClick={() => products.refetch()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Heart className="mx-auto size-10 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">{isShared ? "Nothing to show" : "Your list is empty"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any product to save it here.
          </p>
          <Button asChild variant="gold" className="mt-5 rounded-full">
            <Link to="/browse">Browse all products</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="text-sm">
              <p className="font-semibold">
                {rows.length} {rows.length === 1 ? "item" : "items"}
              </p>
              {!cartUrl && (
                <p className="text-muted-foreground">Open each item to add it to your Amazon cart.</p>
              )}
              <p className="text-muted-foreground">You finish your purchase on Amazon.</p>
            </div>
            {cartUrl && (
              <Button asChild variant="gold" size="lg" className="mt-3 w-full rounded-full sm:mt-0 sm:w-auto">
                <a href={cartUrl} target="_blank" rel="sponsored noopener noreferrer">
                  <ShoppingCart aria-hidden="true" /> Add all to my Amazon cart
                  <span className="sr-only">(opens {country === "IN" ? "Amazon.in" : "Amazon.com"} in a new tab)</span>
                </a>
              </Button>
            )}
          </div>
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {rows.map((p) => (
              <li key={p.id}>
                <PhotoTile product={p} onRemove={isShared ? undefined : () => removeSaved(p.episode)} />
              </li>
            ))}
          </ol>
        </>
      )}
    </SiteShell>
  );
}
