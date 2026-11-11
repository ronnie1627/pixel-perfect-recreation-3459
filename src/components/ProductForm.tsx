import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNCATEGORISED, categoriesQuery, groupCategories } from "@/lib/catalog";
import { ReelEmbed } from "@/components/ReelEmbed";
import {
  ASIN_PATTERN,
  extractAsin,
  extractReelCode,
  isAmazonUrl,
  isMissingAffiliateTag,
  isValidHttpUrl,
  reelUrl,
} from "@/lib/links";
import type { Product } from "@/lib/products";

export type ProductInput = {
  episode: number;
  name: string;
  brand: string;
  reel_code: string;
  amazon_url: string;
  amazon_url_in: string | null;
  image_url: string;
  published: boolean;
  main_category: string;
  category: string;
  asin_us: string | null;
  asin_in: string | null;
};

const NO_SUB = "__none";

const schema = z.object({
  episode: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Enter an episode number"),
  name: z.string().trim().min(1, "Enter a product name").max(200, "Keep it under 200 characters"),
  brand: z.string().trim().max(120, "Keep it under 120 characters"),
  reelUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || extractReelCode(v) !== null, "Paste an Instagram reel link, e.g. instagram.com/reel/…"),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "That link is too long")
    .refine((v) => v === "" || isValidHttpUrl(v), "Enter a valid image link starting with https://"),
  amazonUrl: z
    .string()
    .trim()
    .min(1, "Enter the Amazon link")
    .max(2048, "That link is too long")
    .refine(isAmazonUrl, "Enter an Amazon link, e.g. https://www.amazon.com/… or https://amzn.to/…"),
  amazonUrlIn: z
    .string()
    .trim()
    .max(2048, "That link is too long")
    .refine((v) => v === "" || isAmazonUrl(v), "Enter an Amazon link, e.g. https://www.amazon.in/… or https://amzn.to/…"),
  asinUs: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || ASIN_PATTERN.test(v), "An ASIN is 10 letters or numbers, e.g. B0C1234567"),
  asinIn: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || ASIN_PATTERN.test(v), "An ASIN is 10 letters or numbers, e.g. B0C1234567"),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function ProductForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: Product | null;
  submitting: boolean;
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}) {
  const [episode, setEpisode] = useState(initial ? String(initial.episode) : "");
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [reel, setReel] = useState(initial?.reel_code ? reelUrl(initial.reel_code) : "");
  const [amazonUrl, setAmazonUrl] = useState(initial?.amazon_url ?? "");
  const [amazonUrlIn, setAmazonUrlIn] = useState(initial?.amazon_url_in ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [mainCategory, setMainCategory] = useState(initial?.main_category || UNCATEGORISED);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [asinUs, setAsinUs] = useState(initial?.asin_us ?? "");
  const [asinIn, setAsinIn] = useState(initial?.asin_in ?? "");
  const { data: categoryRows = [] } = useQuery(categoriesQuery);
  const groups = groupCategories(categoryRows);
  const subs = groups.find((g) => g.main.main_category === mainCategory)?.subs ?? [];
  const [errors, setErrors] = useState<Errors>({});

  const previewCode = useMemo(() => extractReelCode(reel), [reel]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({
      episode,
      name,
      brand,
      reelUrl: reel,
      imageUrl,
      amazonUrl,
      amazonUrlIn,
      asinUs,
      asinIn,
    });
    if (!result.success) {
      const next: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit({
      episode: Number(result.data.episode),
      name: result.data.name,
      brand: result.data.brand,
      reel_code: extractReelCode(result.data.reelUrl) ?? "",
      amazon_url: result.data.amazonUrl,
      amazon_url_in: result.data.amazonUrlIn || null,
      image_url: result.data.imageUrl,
      published,
      main_category: mainCategory || UNCATEGORISED,
      category: subs.some((s) => s.name === category) ? category : "",
      asin_us: result.data.asinUs || null,
      asin_in: result.data.asinIn || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div className="space-y-4">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Field id="episode" label="Episode" error={errors.episode}>
            <Input
              id="episode"
              inputMode="numeric"
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              placeholder="371"
              aria-invalid={!!errors.episode}
              aria-describedby={errors.episode ? "episode-error" : undefined}
            />
          </Field>
          <Field id="name" label="Product name" error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wireless charger"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>
        </div>
        <Field id="brand" label="Brand" error={errors.brand}>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Anker"
            aria-invalid={!!errors.brand}
            aria-describedby={errors.brand ? "brand-error" : undefined}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="main-category">Main category</Label>
            <Select
              value={mainCategory}
              onValueChange={(v) => {
                setMainCategory(v);
                setCategory("");
              }}
            >
              <SelectTrigger id="main-category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.main.id} value={g.main.main_category}>
                    {g.main.emoji ? `${g.main.emoji} ` : ""}
                    {g.main.main_category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-category">Subcategory</Label>
            <Select
              value={category || NO_SUB}
              onValueChange={(v) => setCategory(v === NO_SUB ? "" : v)}
              disabled={subs.length === 0}
            >
              <SelectTrigger id="sub-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUB}>None</SelectItem>
                {subs.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Field
          id="reel"
          label="Instagram reel URL"
          error={errors.reelUrl}
          hint={previewCode ? `Reel code: ${previewCode}` : "Only the reel code is saved."}
        >
          <Input
            id="reel"
            type="url"
            value={reel}
            onChange={(e) => setReel(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
            aria-invalid={!!errors.reelUrl}
            aria-describedby={errors.reelUrl ? "reel-error" : "reel-hint"}
          />
        </Field>
        <Field id="image" label="Product photo link" error={errors.imageUrl} hint="Paste an image address, e.g. right-click the Amazon photo → Copy image address.">
          <Input
            id="image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://m.media-amazon.com/images/…"
            aria-invalid={!!errors.imageUrl}
            aria-describedby={errors.imageUrl ? "image-error" : "image-hint"}
          />
        </Field>
        <Field
          id="amazon"
          label="Amazon US link"
          error={errors.amazonUrl}
          warning={isMissingAffiliateTag(amazonUrl) ? "This link has no “tag=” — it may not earn you a commission." : undefined}
        >
          <Input
            id="amazon"
            type="url"
            value={amazonUrl}
            onChange={(e) => {
              setAmazonUrl(e.target.value);
              const asin = extractAsin(e.target.value);
              if (asin) setAsinUs(asin);
            }}
            placeholder="https://amzn.to/…"
            aria-invalid={!!errors.amazonUrl}
            aria-describedby={errors.amazonUrl ? "amazon-error" : undefined}
          />
        </Field>
        <Field
          id="amazon-in"
          label="Amazon India link (optional)"
          error={errors.amazonUrlIn}
          hint="Shown to visitors who shop from India. Leave empty to use the link above."
          warning={isMissingAffiliateTag(amazonUrlIn) ? "This link has no “tag=” — it may not earn you a commission." : undefined}
        >
          <Input
            id="amazon-in"
            type="url"
            value={amazonUrlIn}
            onChange={(e) => {
              setAmazonUrlIn(e.target.value);
              const asin = extractAsin(e.target.value);
              if (asin) setAsinIn(asin);
            }}
            placeholder="https://www.amazon.in/…"
            aria-invalid={!!errors.amazonUrlIn}
            aria-describedby={errors.amazonUrlIn ? "amazon-in-error" : "amazon-in-hint"}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="asin-us" label="US ASIN (optional)" error={errors.asinUs} hint="Filled in from /dp/… links. Needed for “Add all to cart”.">
            <Input
              id="asin-us"
              value={asinUs}
              onChange={(e) => setAsinUs(e.target.value.toUpperCase())}
              placeholder="B0C1234567"
              maxLength={10}
              aria-invalid={!!errors.asinUs}
              aria-describedby={errors.asinUs ? "asin-us-error" : "asin-us-hint"}
            />
          </Field>
          <Field id="asin-in" label="India ASIN (optional)" error={errors.asinIn} hint="Filled in from amazon.in /dp/… links.">
            <Input
              id="asin-in"
              value={asinIn}
              onChange={(e) => setAsinIn(e.target.value.toUpperCase())}
              placeholder="B0C1234567"
              maxLength={10}
              aria-invalid={!!errors.asinIn}
              aria-describedby={errors.asinIn ? "asin-in-error" : "asin-in-hint"}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <Label htmlFor="published">Published</Label>
            <p className="text-xs text-muted-foreground">Hidden products don't appear on the site.</p>
          </div>
          <Switch id="published" checked={published} onCheckedChange={setPublished} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="gold" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            {initial ? "Save changes" : "Add product"}
          </Button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Live preview</p>
        <ReelEmbed reelCode={previewCode} title={name || "Preview"} />
        <p className="mt-4 mb-2 text-sm font-medium">Photo preview</p>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
          {isValidHttpUrl(imageUrl.trim()) ? (
            <img src={imageUrl.trim()} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-muted-foreground">No photo yet</span>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  warning,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  warning?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {!error && warning && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
          <AlertTriangle className="size-3.5" aria-hidden="true" /> {warning}
        </p>
      )}
    </div>
  );
}
