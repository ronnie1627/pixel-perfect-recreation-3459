import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clapperboard, Image as ImageIcon } from "lucide-react";
import { ProductFeed, type FeedView } from "@/components/ProductFeed";
import { SiteShell } from "@/components/site/SiteShell";
import { SortSelect } from "@/components/SortSelect";
import { UNCATEGORISED, categoriesQuery, groupCategories } from "@/lib/catalog";
import { parseSort, type SortOrder } from "@/lib/search";
import { cn } from "@/lib/utils";

type BrowseSearch = {
  q?: string | undefined;
  sort?: SortOrder | undefined;
  view?: FeedView | undefined;
  main?: string | undefined;
  cat?: string | undefined;
};

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.slice(0, max) : undefined);

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => {
    const main = text(search["main"], 60);
    return {
      q: text(search["q"], 120),
      sort: search["sort"] === "oldest" ? "oldest" : undefined,
      view: search["view"] === "reels" ? "reels" : search["view"] === "photos" ? "photos" : undefined,
      main,
      cat: main ? text(search["cat"], 60) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Browse all products – Vettly" },
      {
        name: "description",
        content: "Every product tested in my reels, by category, with photos, reels and direct Amazon links.",
      },
      { property: "og:title", content: "Browse all products – Vettly" },
      { property: "og:description", content: "Every tested product in one place, with direct links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

const chip =
  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
const chipOn = "border-transparent bg-gold text-gold-foreground";
const chipOff = "border-border bg-card hover:bg-muted";

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const view: FeedView = search.view ?? "photos";
  const sort = parseSort(search.sort);
  const { data: rows = [] } = useQuery(categoriesQuery);
  const groups = groupCategories(rows).filter((g) => g.main.main_category !== UNCATEGORISED);
  const current = groups.find((g) => g.main.main_category === search.main);

  const heading = search.cat ?? search.main ?? "All products";

  return (
    <SiteShell search={search.q ?? ""} liveSearch>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{heading}</h1>
        <div role="group" aria-label="View" className="inline-flex rounded-full border border-border bg-card p-1 shadow-card">
          {(
            [
              { v: "photos", label: "Photos", icon: ImageIcon },
              { v: "reels", label: "Reels", icon: Clapperboard },
            ] as const
          ).map(({ v, label, icon: Icon }) => (
            <Link
              key={v}
              from="/browse"
              to="."
              search={(prev) => ({ ...prev, view: v })}
              replace
              resetScroll={false}
              aria-pressed={view === v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                view === v ? "bg-gold text-gold-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" /> {label}
            </Link>
          ))}
        </div>
      </div>

      <nav aria-label="Categories" className="mt-5 space-y-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <Link
            from="/browse"
            to="."
            search={(prev) => ({ ...prev, main: undefined, cat: undefined })}
            className={cn(chip, !search.main ? chipOn : chipOff)}
            aria-current={!search.main ? "true" : undefined}
          >
            All
          </Link>
          {groups.map(({ main }) => {
            const on = search.main === main.main_category;
            return (
              <Link
                key={main.id}
                from="/browse"
                to="."
                search={(prev) => ({ ...prev, main: main.main_category, cat: undefined })}
                className={cn(chip, on ? chipOn : chipOff)}
                aria-current={on ? "true" : undefined}
              >
                {main.emoji && <span aria-hidden="true" className="mr-1">{main.emoji}</span>}
                {main.main_category}
              </Link>
            );
          })}
        </div>
        {current && current.subs.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link
              from="/browse"
              to="."
              search={(prev) => ({ ...prev, cat: undefined })}
              className={cn(chip, "py-1 text-xs", !search.cat ? chipOn : chipOff)}
              aria-current={!search.cat ? "true" : undefined}
            >
              All {current.main.main_category}
            </Link>
            {current.subs.map((s) => {
              const on = search.cat === s.name;
              return (
                <Link
                  key={s.id}
                  from="/browse"
                  to="."
                  search={(prev) => ({ ...prev, cat: s.name })}
                  className={cn(chip, "py-1 text-xs", on ? chipOn : chipOff)}
                  aria-current={on ? "true" : undefined}
                >
                  {s.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="mt-5 mb-4 flex justify-end">
        <SortSelect
          value={sort}
          onChange={(v) =>
            navigate({
              search: (prev) => ({ ...prev, sort: v === "oldest" ? "oldest" : undefined }),
              replace: true,
              resetScroll: false,
            })
          }
        />
      </div>

      <ProductFeed
        view={view}
        layout={view}
        query={search.q ?? ""}
        sort={sort}
        main={search.main}
        cat={search.cat}
        showCount
      />
    </SiteShell>
  );
}
