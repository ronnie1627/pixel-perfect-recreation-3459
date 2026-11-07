import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReelEmbed } from "@/components/ReelEmbed";
import { pickAmazonLink, useShopCountry } from "@/lib/country";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const added = new Date(product.created_at);
  const link = pickAmazonLink(product, useShopCountry());
  return (
    <article
      aria-labelledby={`p-${product.id}`}
      className="animate-rise flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <Badge variant="gold" className="self-start rounded-full px-3 py-1 text-xs">
        Ep. {product.episode}
      </Badge>
      <div className="mt-3 mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`p-${product.id}`} className="text-xl leading-tight font-bold">
            {product.name}
          </h2>
          {product.brand && <p className="mt-0.5 text-sm text-muted-foreground">{product.brand}</p>}
        </div>
        <time
          dateTime={product.created_at}
          className="shrink-0 pt-1 text-xs text-muted-foreground"
        >
          {format(added, "d MMM yyyy")}
        </time>
      </div>
      <ReelEmbed reelCode={product.reel_code} title={product.name} className="mt-auto" />
      <Button asChild variant="gold" size="xl" className="mt-4 w-full">
        <a href={link.url} target="_blank" rel="sponsored noopener noreferrer">
          Click here for your link
          <ExternalLink aria-hidden="true" />
          <span className="sr-only">(opens {link.store} in a new tab)</span>
        </a>
      </Button>
      <p className="mt-1.5 text-center text-xs text-muted-foreground" aria-hidden="true">
        Opens {link.store}
      </p>
    </article>
  );
}
