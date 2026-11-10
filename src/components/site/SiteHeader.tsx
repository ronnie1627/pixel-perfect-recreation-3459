import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/Wordmark";
import { useMyList } from "@/lib/my-list";

/** Menu on the left, logo in the middle, My list heart on the right. */
export function SiteHeader({ onMenu }: { onMenu: () => void }) {
  const count = useMyList().length;
  return (
    <header className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-3 pt-3 sm:px-6 lg:px-8">
      <div>
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open menu" className="rounded-full">
          <Menu className="size-5" />
        </Button>
      </div>
      <Link
        to="/"
        aria-label="Vettly home"
        className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Wordmark className="text-3xl" />
      </Link>
      <div className="flex items-center justify-end gap-0.5">
        <span className="hidden sm:block">
          <ThemeToggle />
        </span>
        <Button variant="ghost" size="icon" asChild className="relative rounded-full">
          <Link to="/list" aria-label={`My list, ${count} ${count === 1 ? "item" : "items"}`}>
            <Heart className="size-5" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </Button>
      </div>
    </header>
  );
}
