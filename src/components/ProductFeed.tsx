import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProductPage, PUBLIC_PAGE_SIZE } from "@/lib/products";
import type { SortOrder } from "@/lib/search";

// One column on phones, two on tablets, three on laptops/desktops.
const GRID = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

export function ProductFeed({ query, sort }: { query: string; sort: SortOrder }) {
  const sentinel = useRef<HTMLDivElement>(null);

  const feed = useInfiniteQuery({
    queryKey: ["products", "public", query, sort],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchProductPage({ query, sort, offset: pageParam, pageSize: PUBLIC_PAGE_SIZE }),
    getNextPageParam: (last) => last.nextOffset,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending) {
    return (
      <div className={GRID} aria-busy="true" aria-label="Loading products">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="mt-3 h-6 w-2/3" />
            <Skeleton className="mt-2 mb-4 h-4 w-1/3" />
            <Skeleton className="aspect-[9/16] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (feed.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-medium">Couldn't load products.</p>
        <Button variant="outline" className="mt-4" onClick={() => feed.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const products = feed.data.pages.flatMap((p) => p.rows);
  const total = feed.data.pages[0]?.count ?? 0;

  return (
    <section aria-label="Products">
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 product" : `${total} products`}
        {query.trim() ? ` for “${query.trim()}”` : ""}
      </p>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <PackageSearch className="mx-auto size-10 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">No products found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try an episode number like “371” or a brand name.
          </p>
        </div>
      ) : (
        <ol className={GRID}>
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ol>
      )}

      <div ref={sentinel} className="flex h-16 items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading more" />
        )}
      </div>
    </section>
  );
}
