import { useMemo, useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ReelEmbed } from "@/components/ReelEmbed";
import { extractReelCode, isValidHttpUrl, reelUrl } from "@/lib/links";
import type { Product } from "@/lib/products";

export type ProductInput = {
  episode: number;
  name: string;
  brand: string;
  reel_code: string;
  amazon_url: string;
  published: boolean;
};

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
  amazonUrl: z
    .string()
    .trim()
    .min(1, "Enter the Amazon link")
    .max(2048, "That link is too long")
    .refine(isValidHttpUrl, "Enter a valid link starting with https://"),
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
  const [published, setPublished] = useState(initial?.published ?? true);
  const [errors, setErrors] = useState<Errors>({});

  const previewCode = useMemo(() => extractReelCode(reel), [reel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse({ episode, name, brand, reelUrl: reel, amazonUrl });
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
      published,
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
        <Field id="amazon" label="Amazon link" error={errors.amazonUrl}>
          <Input
            id="amazon"
            type="url"
            value={amazonUrl}
            onChange={(e) => setAmazonUrl(e.target.value)}
            placeholder="https://amzn.to/…"
            aria-invalid={!!errors.amazonUrl}
            aria-describedby={errors.amazonUrl ? "amazon-error" : undefined}
          />
        </Field>
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
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
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
    </div>
  );
}
