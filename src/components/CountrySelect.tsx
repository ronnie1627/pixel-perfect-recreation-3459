import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_LABELS, useSetShopCountry, useShopCountry, type ShopCountry } from "@/lib/country";

/** Small "Shop from" pill; the choice is kept in the URL as ?country=. */
export function CountrySelect() {
  const country = useShopCountry();
  const setCountry = useSetShopCountry();
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-3 shadow-card">
        <span aria-hidden="true" className="text-xs whitespace-nowrap text-muted-foreground">
          Shop from
        </span>
        <Select value={country} onValueChange={(v) => setCountry(v as ShopCountry)}>
          <SelectTrigger
            aria-label="Shop from"
            className="h-7 w-[140px] rounded-full border-0 bg-muted text-xs"
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
      <p className="text-center text-[10px] leading-tight text-muted-foreground">
        Availability and shipping depend on your country's Amazon store.
      </p>
    </div>
  );
}
