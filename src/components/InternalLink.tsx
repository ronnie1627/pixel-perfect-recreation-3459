import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";

/** Adds the current ?country= to an internal path so "Shop from" survives the click. */
export function withCountry(href: string, country: unknown): string {
  if (typeof country !== "string" || !country || /[?&]country=/.test(href)) return href;
  const [path = "", hash] = href.split("#");
  const joined = `${path}${path.includes("?") ? "&" : "?"}country=${encodeURIComponent(country)}`;
  return hash !== undefined ? `${joined}#${hash}` : joined;
}

/** A link to a site path given as text (e.g. a banner's "/browse?main=Tech"). */
export function InternalLink({
  href,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const router = useRouter();
  const country = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown>)["country"],
  });
  const target = withCountry(href, country);
  return (
    <a
      {...rest}
      href={target}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        void router.navigate({ href: target });
      }}
    />
  );
}
