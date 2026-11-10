import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleSaved, useMyList } from "@/lib/my-list";
import { cn } from "@/lib/utils";

export function HeartButton({
  episode,
  name,
  className,
}: {
  episode: number;
  name: string;
  className?: string;
}) {
  const saved = useMyList().includes(episode);
  const [pops, setPops] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from My list` : `Save ${name} to My list`}
      onClick={() => {
        toggleSaved(episode);
        setPops((n) => n + 1);
      }}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card/90 shadow-card backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Heart
        key={pops}
        aria-hidden="true"
        className={cn(
          "size-[18px]",
          pops > 0 && "animate-pop",
          saved ? "fill-gold text-gold" : "text-foreground",
        )}
      />
    </button>
  );
}
