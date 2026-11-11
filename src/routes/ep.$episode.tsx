import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Check, ImageOff, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AmazonButton } from "@/components/AmazonButton";
import { HeartButton } from "@/components/HeartButton";
import { PhotoTile } from "@/components/PhotoTile";
import { ReelEmbed } from "@/components/ReelEmbed";
import { SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UNCATEGORISED } from "@/lib/catalog";
import { getEpisodePage } from "@/lib/products.functions";

const episodeQuery = (episode: number) =>
  queryOptions({
    queryKey: ["products", "episode", episode],
    queryFn: async () => {
      const page = await getEpisodePage({ data: { episode } });
      if (!page) throw notFound();
      return page;
    },
  });

function parseEpisode(raw: string): number {
  return /^\d{1,9}$/.test(raw) ? Number(raw) : -1;
}

export const Route = createFileRoute("/ep/$episode")({
  loader: async ({ params, context }) => {
    const episode = parseEpisode(params.episode);
    if (episode < 0) throw notFound();
    return context.queryClient.ensureQueryData(episodeQuery(episode));
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) {
      return { meta: [{ title: "Product not found – Vettly" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Ep. ${p.episode}: ${p.name} – Vettly`;
    const description = `${p.name}${p.brand ? ` by ${p.brand}` : ""} — tested in episode ${p.episode}. Watch the reel, then grab the Amazon link.`;
    const image = /^https:\/\//i.test(p.image_url) ? p.image_url : "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  component: EpisodePage,
  notFoundComponent: EpisodeNotFound,
  errorComponent: EpisodeError,
});

function EpisodePage() {
  const { episode } = Route.useParams();
  const { data } = useSuspenseQuery(episodeQuery(parseEpisode(episode)));
  const { product: p, related } = data;
  const [copied, setCopied] = useState(false);
  const hasCategory = p.main_category && p.main_category !== UNCATEGORISED;

  async function share() {
    const url = `${window.location.origin}/ep/${p.episode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <SiteShell>
      <article className="mx-auto mt-8 grid max-w-4xl gap-8 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="mx-auto w-full max-w-[380px]">
          <ReelEmbed reelCode={p.reel_code} title={p.name} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="gold" className="rounded-full px-3 py-1 text-xs">
              Ep. {p.episode}
            </Badge>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={share}>
                {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
                {copied ? "Copied" : "Share"}
              </Button>
              <HeartButton episode={p.episode} name={p.name} />
            </div>
          </div>
          <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">{p.name}</h1>
          {p.brand && <p className="mt-1 text-muted-foreground">{p.brand}</p>}
          {hasCategory && (
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link
                to="/browse"
                search={{ main: p.main_category }}
                className="rounded-full bg-gold-soft px-3 py-1 font-medium hover:bg-gold hover:text-gold-foreground"
              >
                {p.main_category}
              </Link>
              {p.category && (
                <Link
                  to="/browse"
                  search={{ main: p.main_category, cat: p.category }}
                  className="rounded-full border border-border px-3 py-1 hover:bg-muted"
                >
                  {p.category}
                </Link>
              )}
            </p>
          )}
          <div className="mt-5 aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-muted">
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-8" aria-hidden="true" />
              </div>
            )}
          </div>
          <AmazonButton product={p} className="mt-6 max-w-md" />
          <p className="mt-3 max-w-md text-xs text-muted-foreground">
            Links are Amazon affiliate links — I may earn a small commission at no extra cost to you.
          </p>
        </div>
      </article>

      {related.length >= 2 && (
        <section aria-labelledby="more-picks" className="mx-auto mt-12 max-w-4xl">
          <h2 id="more-picks" className="mb-4 text-xl font-bold">
            More picks
          </h2>
          <ol className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <PhotoTile product={r} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </SiteShell>
  );
}

function EpisodeNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That episode doesn't exist or isn't on the site any more.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="gold">
            <Link to="/browse">Browse all products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function EpisodeError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <p className="font-medium">Couldn't load this product.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
