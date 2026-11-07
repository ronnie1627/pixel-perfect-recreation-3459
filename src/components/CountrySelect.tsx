import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_LABELS, setShopCountry, useShopCountry, type ShopCountry } from "@/lib/country";

export function CountrySelect() {
  const country = useShopCountry();
  return (
    <div className="flex items-center gap-2">
      <span id="shop-from-label" className="hidden text-xs text-muted-foreground sm:inline">
        Shop from
      </span>
      <Select value={country} onValueChange={(v) => setShopCountry(v as ShopCountry)}>
        <SelectTrigger
          aria-labelledby="shop-from-label"
          aria-label="Shop from"
          className="h-9 w-[140px] rounded-full bg-card"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(COUNTRY_LABELS) as ShopCountry[]).map((c) => (
            <SelectItem key={c} value={c}>
              {COUNTRY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
