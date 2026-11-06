import { Clapperboard } from "lucide-react";
import { reelEmbedUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

// Instagram's reel embed paints its own chrome around the video: a 54px header
// (avatar, username, "View profile") above the video and a 154px footer
// ("View more on Instagram", like/comment/share/save, likes, comment box)
// below it. Both are fixed heights at every embed width, measured across
// 320-640px, and the video itself is always embed-width x width*1.25.
// The iframe is cross-origin so that chrome can't be styled away — it is
// cropped out instead: the iframe is 208px taller than the box and shifted up
// by the header height, leaving only the video visible.
const HEADER = 54;
const FOOTER = 154;

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
        "relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-muted",
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
          aria-hidden="true"
          tabIndex={-1}
          className="absolute top-0 border-0"
          // 9:16 box: video height (iframe width x 1.25) must equal box height,
          // so the iframe is 16/9/1.25 = 142.22% wide, centered, sides cropped.
          style={{
            width: "142.2222%",
            left: "-21.1111%",
            height: `calc(100% + ${HEADER + FOOTER}px)`,
            marginTop: `-${HEADER}px`,
          }}
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
