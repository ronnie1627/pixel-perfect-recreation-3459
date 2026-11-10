import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

const PHRASES = ["Search for earbuds", "Search for a kitchen gadget", "Search for ep 21"];

/**
 * Large rounded search with a rotating placeholder. Submitting opens /browse
 * with ?q=; on /browse itself (live) typing updates the results as you go.
 */
export function SearchPill({ initial = "", live = false }: { initial?: string; live?: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  const [phrase, setPhrase] = useState(0);
  const pushed = useRef(initial);

  // Follow the URL (back/forward, chips) without clobbering what is being typed.
  useEffect(() => {
    if (initial !== pushed.current) {
      pushed.current = initial;
      setValue(initial);
    }
  }, [initial]);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setPhrase((i) => (i + 1) % PHRASES.length), 2800);
    return () => clearInterval(t);
  }, [value]);

  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => {
      const q = value.trim();
      if (q === pushed.current.trim()) return;
      pushed.current = q;
      void navigate({
        to: "/browse",
        search: ((prev: Record<string, unknown>) => ({ ...prev, q: q || undefined })) as never,
        replace: true,
        resetScroll: false,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [value, live, navigate]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    pushed.current = q;
    void navigate({
      to: "/browse",
      search: ((prev: Record<string, unknown>) =>
        live ? { ...prev, q: q || undefined } : { q: q || undefined }) as never,
    });
  }

  return (
    <form role="search" onSubmit={submit} className="relative mx-auto w-full max-w-xl">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-14 w-full rounded-full border border-input bg-card pr-24 pl-6 text-base text-foreground shadow-card transition-colors focus-visible:border-gold focus-visible:ring-4 focus-visible:ring-gold-soft focus-visible:outline-none sm:h-16 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
      />
      {!value && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-6 flex items-center overflow-hidden text-base text-muted-foreground sm:text-lg"
        >
          <span key={phrase} className="animate-placeholder">
            {PHRASES[phrase]}
          </span>
        </span>
      )}
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-16 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:right-[4.5rem]"
        >
          <X className="size-4" />
        </button>
      )}
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-gold transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:size-12"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
