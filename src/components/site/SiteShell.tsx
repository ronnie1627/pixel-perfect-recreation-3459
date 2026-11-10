import { useState, type ReactNode } from "react";
import { CountrySelect } from "@/components/CountrySelect";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { MobileBottomBar } from "@/components/site/MobileBottomBar";
import { SearchPill } from "@/components/site/SearchPill";
import { SiteDrawer } from "@/components/site/SiteDrawer";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

/** Every public page: announcement bar, header, search + Shop from, content, footer, phone bar. */
export function SiteShell({
  children,
  search = "",
  liveSearch = false,
}: {
  children: ReactNode;
  search?: string;
  liveSearch?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col pb-24 md:pb-0">
      <AnnouncementBar />
      <SiteHeader onMenu={() => setMenuOpen(true)} />
      <SiteDrawer open={menuOpen} onOpenChange={setMenuOpen} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <SearchPill initial={search} live={liveSearch} />
        <div className="mt-3">
          <CountrySelect />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">{children}</main>
      <SiteFooter />
      <MobileBottomBar onCategories={() => setMenuOpen(true)} />
    </div>
  );
}
