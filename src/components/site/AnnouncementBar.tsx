import { useQuery } from "@tanstack/react-query";
import { DEFAULT_SETTINGS, settingsQuery } from "@/lib/catalog";
import { isValidHttpUrl } from "@/lib/links";

function isInstagramUrl(url: string) {
  if (!isValidHttpUrl(url)) return false;
  return /(^|\.)instagram\.com$/i.test(new URL(url.trim()).hostname);
}

/** Slim dark bar with a looping message and a "Follow on Instagram" pill. */
export function AnnouncementBar() {
  const { data } = useQuery(settingsQuery);
  const text = (data?.announcement_text || DEFAULT_SETTINGS.announcement_text).trim();
  const instagram = data?.instagram_url.trim() ?? "";
  const segment = Array.from({ length: 4 }, (_, i) => (
    <span key={i} className="flex items-center gap-8 pr-8">
      <span>{text}</span>
      <span aria-hidden="true" className="text-gold">
        ✦
      </span>
    </span>
  ));

  return (
    <div className="bg-bar text-bar-foreground">
      <div className="mx-auto flex h-9 max-w-6xl items-center gap-3 px-3 sm:px-6 lg:px-8">
        <p className="sr-only">{text}</p>
        <div
          aria-hidden="true"
          className="relative min-w-0 flex-1 overflow-hidden text-xs font-medium [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
        >
          <div className="animate-marquee flex w-max whitespace-nowrap">
            <div className="flex shrink-0">{segment}</div>
            <div className="flex shrink-0">{segment}</div>
          </div>
        </div>
        {isInstagramUrl(instagram) && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-bar-pill px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-bar-pill-foreground transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Follow on Instagram
          </a>
        )}
      </div>
    </div>
  );
}
