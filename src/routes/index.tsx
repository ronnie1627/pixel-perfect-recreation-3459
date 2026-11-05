import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProductFeed } from "@/components/ProductFeed";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/Wordmark";
import { parseSort, type SortOrder } from "@/lib/search";

type FeedSearch = { q?: string | undefined; sort?: SortOrder | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    const q = search["q"];
    return {
      q: typeof q === "string" && q ? q.slice(0, 120) : undefined,
      sort: search["sort"] === "oldest" ? "oldest" : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Vettly – Tested picks from my reels" },
      {
        name: "description",
        content:
          "Vetted products. Real reviews. Search every product tested in my Instagram reels by episode, name or brand.",
      },
      { property: "og:title", content: "Vettly – Tested picks from my reels" },
      {
        property: "og:description",
        content: "Vetted products. Real reviews. Watch the reel, then grab the link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const sort = parseSort(search.sort);
  const [input, setInput] = useState(search.q ?? "");

  // Debounce typing into the URL so results are shareable and back/forward works.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = input.trim() ? input : undefined;
      if (q !== search.q) {
        void navigate({ search: (prev) => ({ ...prev, q }), replace: true });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [input, search.q, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[420px] items-center justify-between px-4 pt-5">
        <Link to="/" aria-label="Vettly home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Wordmark className="text-2xl" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-[420px] flex-1 px-4">
        <section className="pt-10 pb-6 text-center">
          <h1 className="text-6xl leading-none font-extrabold">
            <Wordmark />
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Vetted products. Real reviews.</p>
        </section>

        <SearchBar value={input} onChange={setInput} />
        <p className="mt-2 px-1 text-xs text-muted-foreground">
          Links are Amazon affiliate links — I may earn a small commission at no extra cost to you.
        </p>

        <div className="mt-6 mb-4 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Latest picks</span>
          <SortSelect
            value={sort}
            onChange={(v) =>
              navigate({
                search: (prev) => ({ ...prev, sort: v === "oldest" ? "oldest" : undefined }),
                replace: true,
              })
            }
          />
        </div>

        <ProductFeed query={search.q ?? ""} sort={sort} />
      </main>

      <footer className="mt-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-[420px] px-4">
          © Vettly. As an Amazon Associate I earn from qualifying purchases.
        </p>
      </footer>
    </div>
  );
}
