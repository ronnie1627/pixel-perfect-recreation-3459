import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart, Home, Info, LayoutGrid, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/Wordmark";
import { DEFAULT_EMOJI, UNCATEGORISED, categoriesQuery, groupCategories } from "@/lib/catalog";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/browse", label: "Browse all products", icon: LayoutGrid },
  { to: "/list", label: "My list", icon: Heart },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
] as const;

/** Slide-in menu: main links plus categories that expand into subcategories. */
export function SiteDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data = [] } = useQuery(categoriesQuery);
  const groups = groupCategories(data).filter((g) => g.main.main_category !== UNCATEGORISED);
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[86vw] max-w-sm flex-col gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle asChild>
            <div>
              <Wordmark className="text-2xl" />
            </div>
          </SheetTitle>
          <SheetDescription className="text-xs">Vetted products. Real reviews.</SheetDescription>
        </SheetHeader>

        <nav aria-label="Main" className="px-3 py-3">
          <ul className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={close}
                  activeOptions={{ exact: true, includeSearch: false }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted data-[status=active]:bg-gold-soft"
                >
                  <Icon className="size-4 text-gold" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border px-5 pt-4">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Categories</h2>
          <Accordion type="multiple" className="mt-1">
            {groups.map(({ main, subs }) => (
              <AccordionItem key={main.id} value={main.main_category}>
                <AccordionTrigger className="py-3 text-sm hover:no-underline">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true">{main.emoji || DEFAULT_EMOJI}</span>
                    {main.main_category}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-0.5 pl-7">
                    <li>
                      <Link
                        to="/browse"
                        search={{ main: main.main_category }}
                        onClick={close}
                        className="block rounded-md px-2 py-1.5 text-sm font-medium text-gold hover:bg-muted"
                      >
                        All {main.main_category}
                      </Link>
                    </li>
                    {subs.map((s) => (
                      <li key={s.id}>
                        <Link
                          to="/browse"
                          search={{ main: main.main_category, cat: s.name }}
                          onClick={close}
                          className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-4 text-sm text-muted-foreground">
          Theme
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
