import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AmazonButton } from "@/components/AmazonButton";
import { HeartButton } from "@/components/HeartButton";
import { ReelEmbed } from "@/components/ReelEmbed";
import { Reveal } from "@/components/Reveal";
import { categoryLabel } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/** Reel card: episode, name, reel, link button. */
export function ProductCard({ product }: { product: Product }) {
  const added = new Date(product.created_at);
  const category = categoryLabel(product);
  return (
    <Reveal className="h-full">
      <article
        aria-labelledby={`p-${product.id}`}
        className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-card"
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="gold" className="rounded-full px-3 py-1 text-xs">
            Ep. {product.episode}
          </Badge>
          <HeartButton episode={product.episode} name={product.name} />
        </div>
        <div className="mt-3 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={`p-${product.id}`} className="text-xl leading-tight font-bold">
              <Link
                to="/ep/$episode"
                params={{ episode: String(product.episode) }}
                className="rounded-sm hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {product.name}
              </Link>
            </h2>
            {product.brand && <p className="mt-0.5 text-sm text-muted-foreground">{product.brand}</p>}
            {category && <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>}
          </div>
          <time dateTime={product.created_at} className="shrink-0 pt-1 text-xs text-muted-foreground">
            {format(added, "d MMM yyyy")}
          </time>
        </div>
        <ReelEmbed reelCode={product.reel_code} title={product.name} className="mt-auto" />
        <AmazonButton product={product} className="mt-4" />
      </article>
    </Reveal>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4" aria-hidden="true">
      <div className="flex justify-between">
        <div className="skeleton-shimmer h-6 w-20 rounded-full" />
        <div className="skeleton-shimmer size-9 rounded-full" />
      </div>
      <div className="skeleton-shimmer mt-3 h-6 w-2/3 rounded-md" />
      <div className="skeleton-shimmer mt-2 mb-4 h-4 w-1/3 rounded-md" />
      <div className="skeleton-shimmer aspect-[9/16] w-full rounded-xl" />
      <div className="skeleton-shimmer mt-4 h-13 w-full rounded-xl" />
    </div>
  );
}
