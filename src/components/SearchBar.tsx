import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  size?: "lg" | "md";
  className?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Episode, product or brand",
  label = "Search products",
  size = "lg",
  className,
}: Props) {
  return (
    <div role="search" className={cn("relative", className)}>
      <label htmlFor={`search-${size}`} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "left-5 size-5" : "left-3 size-4",
        )}
      />
      <input
        id={`search-${size}`}
        type="search"
        inputMode="search"
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full border border-input bg-card text-foreground placeholder:text-muted-foreground shadow-card transition-colors",
          "focus-visible:border-gold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-soft",
          "[&::-webkit-search-cancel-button]:hidden",
          size === "lg"
            ? "h-16 rounded-2xl pl-14 pr-14 text-lg"
            : "h-10 rounded-lg pl-9 pr-9 text-sm",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "lg" ? "right-4" : "right-2",
          )}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
