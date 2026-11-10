import { Link } from "@tanstack/react-router";
import { ImageOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AmazonButton } from "@/components/AmazonButton";
import { HeartButton } from "@/components/HeartButton";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/products";

/** Photo tile: product photo, episode, name and link button. */
export function PhotoTile({ product, onRemove }: { product: Product; onRemove?: () => void }) {
  const params = { episode: String(product.episode) };
  return (
    <Reveal className="h-full">
      <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-3 shadow-card">
        <div className="relative">
          <Link
            to="/ep/$episode"
            params={params}
            tabIndex={-1}
            aria-hidden="true"
            className="block aspect-square overflow-hidden rounded-xl bg-muted"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain transition-transform duration-300 hover:scale-[1.03]"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-8" />
              </span>
            )}
          </Link>
          <Badge variant="gold" className="pointer-events-none absolute top-2 left-2 rounded-full">
            Ep. {product.episode}
          </Badge>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${product.name} from My list`}
              className="absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/90 shadow-card backdrop-blur hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <HeartButton episode={product.episode} name={product.name} className="absolute top-2 right-2" />
          )}
        </div>
        <h2 className="mt-3 line-clamp-2 text-sm font-bold sm:text-base">
          <Link
            to="/ep/$episode"
            params={params}
            className="rounded-sm hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.name}
          </Link>
        </h2>
        <AmazonButton product={product} compact className="mt-auto pt-3" />
      </article>
    </Reveal>
  );
}

export function PhotoTileSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3" aria-hidden="true">
      <div className="skeleton-shimmer aspect-square rounded-xl" />
      <div className="skeleton-shimmer mt-3 h-4 w-3/4 rounded-md" />
      <div className="skeleton-shimmer mt-3 h-9 w-full rounded-md" />
    </div>
  );
}
