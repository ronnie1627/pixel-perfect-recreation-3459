import { Clapperboard } from "lucide-react";
import { reelEmbedUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

export function ReelEmbed({
  reelCode,
  title,
  className,
}: {
  reelCode: string | null | undefined;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border bg-muted",
        className,
      )}
    >
      {reelCode ? (
        <iframe
          key={reelCode}
          src={reelEmbedUrl(reelCode)}
          title={`Instagram reel: ${title}`}
          loading="lazy"
          allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
          <Clapperboard className="size-10 text-gold" aria-hidden="true" />
          <p className="text-sm">Reel coming soon</p>
        </div>
      )}
    </div>
  );
}
