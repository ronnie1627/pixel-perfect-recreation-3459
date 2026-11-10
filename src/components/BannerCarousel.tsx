import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight } from "lucide-react";
import { InternalLink } from "@/components/InternalLink";
import { Wordmark } from "@/components/Wordmark";
import { publicBannersQuery } from "@/lib/catalog";
import { isInternalPath, isValidHttpUrl } from "@/lib/links";
import { cn } from "@/lib/utils";

export type BannerContent = {
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  link: string;
};

const DEFAULT_BANNER: BannerContent & { id: string } = {
  id: "default",
  image_url: "",
  title: "Vetted products. Real reviews.",
  subtitle: "Watch the reel, then grab the link — every product is tested on camera.",
  button_text: "Browse all products",
  link: "/browse",
};

/** One banner. Also used for the live preview in the admin. */
export function BannerSlide({ banner, isDefault = false }: { banner: BannerContent; isDefault?: boolean }) {
  const image = isValidHttpUrl(banner.image_url) ? banner.image_url.trim() : "";
  const link = isInternalPath(banner.link) ? banner.link.trim() : "";
  const body = (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[28px] bg-gradient-banner text-bar-foreground sm:aspect-[21/8]">
      {image && (
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {image && <div className="absolute inset-0 bg-gradient-scrim" aria-hidden="true" />}
      <div className="relative flex h-full max-w-[85%] flex-col justify-end gap-1.5 p-5 sm:max-w-[60%] sm:p-9">
        {isDefault && <Wordmark className="text-xl sm:text-2xl" />}
        {banner.title && (
          <h2 className="text-2xl leading-[1.05] font-extrabold sm:text-4xl lg:text-5xl">{banner.title}</h2>
        )}
        {banner.subtitle && <p className="text-sm opacity-85 sm:text-base">{banner.subtitle}</p>}
        {banner.button_text && link && (
          <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
            {banner.button_text} <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
  if (!link) return body;
  return (
    <InternalLink
      href={link}
      aria-label={[banner.title, banner.button_text].filter(Boolean).join(" – ") || "Open banner"}
      className="block rounded-[28px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      {body}
    </InternalLink>
  );
}

/** Home banners: next one peeks in, autoplay every 5s, swipe, pause on hover, dash dots. */
export function BannerCarousel() {
  const { data, isPending } = useQuery(publicBannersQuery);
  const banners = data && data.length > 0 ? data : [DEFAULT_BANNER];
  const multi = banners.length > 1;
  const [emblaRef, api] = useEmblaCarousel({ loop: multi, align: "start", active: multi });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect).on("reInit", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect).off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !multi || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(t);
  }, [api, multi, paused, index]);

  const goTo = useCallback((i: number) => api?.scrollTo(i), [api]);

  if (isPending) {
    return <div className="skeleton-shimmer aspect-[16/10] w-full rounded-[28px] sm:aspect-[21/8]" aria-hidden="true" />;
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className={cn("flex", multi && "-ml-3")}>
          {banners.map((b, i) => (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${banners.length}`}
              className={cn(
                "min-w-0 shrink-0 grow-0",
                multi ? "basis-[88%] pl-3 sm:basis-[82%]" : "basis-full",
              )}
            >
              <div
                className={cn(
                  "transition-[opacity,transform] duration-500",
                  multi && i !== index && "scale-[0.97] opacity-70",
                )}
              >
                <BannerSlide banner={b} isDefault={b.id === "default"} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {multi && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                i === index ? "w-7 bg-gold" : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/70",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
