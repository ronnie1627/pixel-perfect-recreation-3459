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
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-xs whitespace-nowrap text-muted-foreground">
          Shop from
        </span>
        <Select value={country} onValueChange={(v) => setShopCountry(v as ShopCountry)}>
          <SelectTrigger
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
      <p className="max-w-[190px] text-right text-[10px] leading-tight text-muted-foreground">
        Availability and shipping depend on your country's Amazon store.
      </p>
    </div>
  );
}
