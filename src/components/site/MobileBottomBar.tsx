import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, LayoutGrid, Shapes } from "lucide-react";
import { useMyList } from "@/lib/my-list";
import { cn } from "@/lib/utils";

const item =
  "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Phones only: Home, Categories (opens the menu), My list, Browse. */
export function MobileBottomBar({ onCategories }: { onCategories: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const count = useMyList().length;
  const active = (p: string) => path === p;

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border bg-card/95 px-2 py-1 shadow-card backdrop-blur md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        <li className="flex flex-1">
          <Link to="/" className={cn(item, active("/") && "text-gold")} aria-current={active("/") ? "page" : undefined}>
            <Home className="size-5" aria-hidden="true" /> Home
          </Link>
        </li>
        <li className="flex flex-1">
          <button type="button" onClick={onCategories} className={item}>
            <Shapes className="size-5" aria-hidden="true" /> Categories
          </button>
        </li>
        <li className="flex flex-1">
          <Link to="/list" className={cn(item, "relative", active("/list") && "text-gold")} aria-current={active("/list") ? "page" : undefined}>
            <Heart className="size-5" aria-hidden="true" /> My list
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 left-1/2 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-gold-foreground"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </li>
        <li className="flex flex-1">
          <Link
            to="/browse"
            className={cn(item, active("/browse") && "text-gold")}
            aria-current={active("/browse") ? "page" : undefined}
          >
            <LayoutGrid className="size-5" aria-hidden="true" /> Browse
          </Link>
        </li>
      </ul>
    </nav>
  );
}
