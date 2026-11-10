import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PackageSearch } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { PhotoTile, PhotoTileSkeleton } from "@/components/PhotoTile";
import { Button } from "@/components/ui/button";
import { useLoadMore } from "@/hooks/use-load-more";
import { fetchProductPage, PHOTO_PAGE_SIZE, REEL_PAGE_SIZE } from "@/lib/products";
import type { SortOrder } from "@/lib/search";
import { cn } from "@/lib/utils";

export type FeedView = "photos" | "reels";

const LAYOUT = {
  /** Home: one reel after another in a single centred column. */
  column: "mx-auto flex max-w-[420px] flex-col gap-6",
  reels: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  photos: "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
};

/**
 * Infinite-scroll product feed. New pages are appended (existing cards keep
 * their keys, so reels already playing are left alone).
 */
export function ProductFeed({
  view,
  layout,
  query = "",
  sort = "newest",
  main,
  cat,
  showCount = false,
}: {
  view: FeedView;
  layout: keyof typeof LAYOUT;
  query?: string;
  sort?: SortOrder;
  main?: string | undefined;
  cat?: string | undefined;
  showCount?: boolean;
}) {
  const pageSize = view === "photos" ? PHOTO_PAGE_SIZE : REEL_PAGE_SIZE;
  const feed = useInfiniteQuery({
    queryKey: ["products", "public", view, query, sort, main ?? "", cat ?? ""],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchProductPage({ query, sort, offset: pageParam, pageSize, status: "published", main, cat }),
    getNextPageParam: (last) => last.nextOffset,
  });
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  const sentinel = useLoadMore({
    hasMore: !!hasNextPage,
    loading: isFetchingNextPage,
    loadMore: () => void fetchNextPage(),
  });

  const Skeleton = view === "photos" ? PhotoTileSkeleton : ProductCardSkeleton;
  const skeletons = (n: number) => Array.from({ length: n }, (_, i) => <Skeleton key={`s${i}`} />);

  if (feed.isPending) {
    return (
      <div className={LAYOUT[layout]} aria-busy="true" aria-label="Loading products">
        {skeletons(view === "photos" ? 8 : 2)}
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
    <div>
      {showCount && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {total === 1 ? "1 product" : `${total} products`}
          {query.trim() ? ` for “${query.trim()}”` : ""}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <PackageSearch className="mx-auto size-10 text-gold" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-bold">No products found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try an episode number like “21”, a brand name or another category.
          </p>
        </div>
      ) : (
        <ol className={LAYOUT[layout]}>
          {products.map((p) => (
            <li key={p.id}>{view === "photos" ? <PhotoTile product={p} /> : <ProductCard product={p} />}</li>
          ))}
          {isFetchingNextPage && (
            <li className={cn(layout === "photos" ? "contents" : undefined)} aria-label="Loading more">
              {layout === "photos" ? skeletons(4) : <Skeleton />}
            </li>
          )}
        </ol>
      )}

      <div ref={sentinel} aria-hidden="true" className="h-4" />
      {isFetchingNextPage && <p className="sr-only" aria-live="polite">Loading more</p>}
      {!hasNextPage && products.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          You've reached the end — that's every {view === "photos" ? "product" : "reel"} so far.{" "}
          {layout === "column" ? (
            <Link to="/browse" className="font-medium text-gold hover:underline">
              Browse all products
            </Link>
          ) : (
            "New product tested every day."
          )}
        </p>
      )}
    </div>
  );
}
