import { useEffect, useRef } from "react";

/** Calls loadMore when the returned sentinel nears the viewport (infinite scroll). */
export function useLoadMore(opts: { hasMore: boolean; loading: boolean; loadMore: () => void }) {
  const { hasMore, loading, loadMore } = opts;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) loadMore();
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, loadMore]);
  return ref;
}
