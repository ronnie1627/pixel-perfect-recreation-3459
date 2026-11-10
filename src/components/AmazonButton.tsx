import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pickAmazonLink, useShopCountry } from "@/lib/country";
import { cn } from "@/lib/utils";

/** The one "Click here for your link" button, with the "Opens Amazon.xx" note under it. */
export function AmazonButton({
  product,
  compact = false,
  className,
}: {
  product: { amazon_url: string; amazon_url_in: string | null };
  compact?: boolean;
  className?: string;
}) {
  const link = pickAmazonLink(product, useShopCountry());
  return (
    <div className={className}>
      <Button
        asChild
        variant="gold"
        size={compact ? "sm" : "xl"}
        className={cn("w-full", compact && "h-auto min-h-9 py-2 text-xs leading-tight whitespace-normal sm:text-sm")}
      >
        <a href={link.url} target="_blank" rel="sponsored noopener noreferrer">
          Click here for your link
          <ExternalLink aria-hidden="true" className={compact ? "hidden sm:block" : undefined} />
          <span className="sr-only">(opens {link.store} in a new tab)</span>
        </a>
      </Button>
      <p
        className={cn("mt-1.5 text-center text-muted-foreground", compact ? "text-[11px]" : "text-xs")}
        aria-hidden="true"
      >
        Opens {link.store}
      </p>
    </div>
  );
}
