import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, ImageOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/Wordmark";
import { CountrySelect } from "@/components/CountrySelect";
import { pickAmazonLink, useShopCountry } from "@/lib/country";
import { fetchProductPage, type Product } from "@/lib/products";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse all products – Vettly" },
      { name: "description", content: "Every product tested in my reels, with photos and direct Amazon links." },
      { property: "og:title", content: "Browse all products – Vettly" },
      { property: "og:description", content: "Every tested product in one place, with direct links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6";

function BrowsePage() {
  const sentinel = useRef<HTMLDivElement>(null);
  const feed = useInfiniteQuery({
    queryKey: ["products", "browse"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchProductPage({ query: "", sort: "newest", offset: pageParam, pageSize: 24 }),
    getNextPageParam: (last) => last.nextOffset,
  });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products = feed.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-5 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Vettly home">
          <Wordmark className="text-2xl" />
        </Link>
        <div className="flex items-center gap-1">
          <CountrySelect />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link to="/">
            <ArrowLeft /> Back to reels
          </Link>
        </Button>
        <h1 className="mt-2 mb-6 text-3xl font-extrabold sm:text-4xl">All products</h1>

        {feed.isPending ? (
          <div className={GRID}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : feed.isError ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-medium">Couldn't load products.</p>
            <Button variant="outline" className="mt-4" onClick={() => feed.refetch()}>
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No products yet.
          </p>
        ) : (
          <ol className={GRID}>
            {products.map((p) => (
              <li key={p.id}>
                <BrowseCard product={p} />
              </li>
            ))}
          </ol>
        )}
        <div ref={sentinel} className="flex h-16 items-center justify-center">
          {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>
      </main>
    </div>
  );
}

function BrowseCard({ product }: { product: Product }) {
  const link = pickAmazonLink(product, useShopCountry());
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden="true" />
          </div>
        )}
        <Badge variant="gold" className="absolute top-2 left-2 rounded-full">
          Ep. {product.episode}
        </Badge>
      </div>
      <h2 className="mt-3 line-clamp-2 text-sm font-bold sm:text-base">{product.name}</h2>
      <Button asChild variant="gold" size="sm" className="mt-auto w-full pt-0">
        <a href={link.url} target="_blank" rel="sponsored noopener noreferrer" className="mt-3">
          Get link <ExternalLink aria-hidden="true" />
          <span className="sr-only">(opens {link.store} in a new tab)</span>
        </a>
      </Button>
      <p className="mt-1 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        Opens {link.store}
      </p>
    </article>
  );
}
