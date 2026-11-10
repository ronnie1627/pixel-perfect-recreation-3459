import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DEFAULT_EMOJI, categoriesQuery, groupCategories, type Category } from "@/lib/catalog";
import { isValidHttpUrl } from "@/lib/links";

/** "Shop by category": round tiles for every category marked show-on-home. */
export function CategoryCircles() {
  const { data, isPending } = useQuery(categoriesQuery);
  const tiles: Category[] = groupCategories(data ?? []).flatMap(({ main, subs }) =>
    [main, ...subs].filter((c) => c.show_on_home),
  );

  if (!isPending && tiles.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="mt-8">
      <h2 id="shop-by-category" className="mb-4 text-lg font-bold sm:text-xl">
        Shop by category
      </h2>
      <ul className="grid grid-cols-5 gap-x-2 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-5">
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex flex-col items-center gap-1.5" aria-hidden="true">
                <span className="skeleton-shimmer size-14 rounded-full sm:size-20" />
                <span className="skeleton-shimmer h-3 w-12 rounded" />
              </li>
            ))
          : tiles.map((c) => <CategoryTile key={c.id} category={c} />)}
      </ul>
    </section>
  );
}

function CategoryTile({ category }: { category: Category }) {
  const label = category.name || category.main_category;
  const image = category.image_url && isValidHttpUrl(category.image_url) ? category.image_url : "";
  return (
    <li className="sm:w-20">
      <Link
        to="/browse"
        search={category.name ? { main: category.main_category, cat: category.name } : { main: category.main_category }}
        className="group flex flex-col items-center gap-1.5 rounded-xl text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="relative rounded-full bg-gradient-ring p-[2px] transition-transform duration-300 group-hover:scale-105 group-hover:animate-ring-pulse">
          <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-gradient-tile text-2xl sm:size-20 sm:text-3xl">
            {image ? (
              <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">{category.emoji || DEFAULT_EMOJI}</span>
            )}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-gold ring-2 ring-background sm:top-1 sm:right-1"
          />
        </span>
        <span className="line-clamp-2 text-[11px] leading-tight font-medium sm:text-xs">{label}</span>
      </Link>
    </li>
  );
}
