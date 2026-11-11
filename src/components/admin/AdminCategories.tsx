import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DEFAULT_EMOJI, UNCATEGORISED, categoriesQuery, groupCategories, type Category } from "@/lib/catalog";
import { isValidHttpUrl } from "@/lib/links";
import { reorderUpdates } from "@/components/admin/reorder";

type Draft = {
  id?: string;
  main_category: string;
  /** "" = this is a main category */
  name: string;
  isMain: boolean;
  emoji: string;
  image_url: string;
  show_on_home: boolean;
  sort_order: number;
};

const countsQuery = {
  queryKey: ["products", "category-counts"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("main_category, category");
    if (error) throw error;
    const counts = new Map<string, number>();
    for (const r of data ?? []) {
      counts.set(r.main_category, (counts.get(r.main_category) ?? 0) + 1);
      const k = `${r.main_category}\u0000${r.category}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  },
};

function errorText(err: unknown) {
  const e = err as { message?: string; code?: string };
  if (e?.code === "23505") return "A category with that name already exists.";
  return e?.message || "Something went wrong.";
}

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: rows = [], isPending } = useQuery(categoriesQuery);
  const { data: counts = new Map<string, number>() } = useQuery(countsQuery);
  const groups = groupCategories(rows);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const fields = {
        emoji: d.emoji.trim(),
        image_url: d.image_url.trim() || null,
        show_on_home: d.show_on_home,
      };
      if (d.id) {
        const patch = d.isMain
          ? { ...fields, main_category: d.main_category.trim() }
          : { ...fields, name: d.name.trim() };
        const { error } = await supabase.from("categories").update(patch).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({
          ...fields,
          main_category: d.main_category.trim(),
          name: d.isMain ? "" : d.name.trim(),
          sort_order: d.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, d) => {
      toast.success(d.id ? "Category saved" : "Category added");
      setDraft(null);
      void refresh();
    },
    onError: (err) => toast.error(errorText(err)),
  });

  const move = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("categories").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => void refresh(),
    onError: (err) => toast.error(errorText(err)),
  });

  const toggleHome = useMutation({
    mutationFn: async ({ id, show }: { id: string; show: boolean }) => {
      const { error } = await supabase.from("categories").update({ show_on_home: show }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void refresh(),
    onError: (err) => toast.error(errorText(err)),
  });

  const remove = useMutation({
    mutationFn: async (c: Category) => {
      const { error } = await supabase.from("categories").delete().eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleting(null);
      void refresh();
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(errorText(err));
    },
  });

  function productCount(c: Category) {
    return c.name === "" ? (counts.get(c.main_category) ?? 0) : (counts.get(`${c.main_category}\u0000${c.name}`) ?? 0);
  }

  function askDelete(c: Category, subCount: number) {
    const n = productCount(c);
    if (c.name === "" && c.main_category === UNCATEGORISED) {
      toast.error("Uncategorised can't be deleted — new products land there.");
    } else if (n > 0) {
      toast.error(`Move its ${n} ${n === 1 ? "product" : "products"} to another category first.`);
    } else if (c.name === "" && subCount > 0) {
      toast.error("Delete its subcategories first.");
    } else {
      setDeleting(c);
    }
  }

  const nextMainOrder = (groups.at(-1)?.main.sort_order ?? 0) + 10;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage categories</h1>
          <p className="text-sm text-muted-foreground">
            Main categories and their subcategories. Turn on “Home” to show a circle on the home page.
          </p>
        </div>
        <Button
          variant="gold"
          onClick={() =>
            setDraft({
              main_category: "",
              name: "",
              isMain: true,
              emoji: "",
              image_url: "",
              show_on_home: true,
              sort_order: Math.min(nextMainOrder, 999),
            })
          }
        >
          <Plus /> Add main category
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      ) : (
        <ol className="mt-6 space-y-4">
          {groups.map((g, gi) => {
            const locked = g.main.main_category === UNCATEGORISED;
            return (
              <li key={g.main.id} className="rounded-xl border border-border bg-card">
                <CategoryRow
                  category={g.main}
                  label={g.main.main_category}
                  count={productCount(g.main)}
                  main
                  locked={locked}
                  canUp={gi > 0}
                  canDown={gi < groups.length - 1}
                  onUp={() => move.mutate(reorderUpdates(groups.map((x) => x.main), gi, -1))}
                  onDown={() => move.mutate(reorderUpdates(groups.map((x) => x.main), gi, 1))}
                  onToggleHome={(show) => toggleHome.mutate({ id: g.main.id, show })}
                  onEdit={() =>
                    setDraft({
                      id: g.main.id,
                      main_category: g.main.main_category,
                      name: "",
                      isMain: true,
                      emoji: g.main.emoji,
                      image_url: g.main.image_url ?? "",
                      show_on_home: g.main.show_on_home,
                      sort_order: g.main.sort_order,
                    })
                  }
                  onDelete={() => askDelete(g.main, g.subs.length)}
                />
                <ol className="border-t border-border">
                  {g.subs.map((s, si) => (
                    <li key={s.id} className="border-b border-border last:border-b-0">
                      <CategoryRow
                        category={s}
                        label={s.name}
                        count={productCount(s)}
                        canUp={si > 0}
                        canDown={si < g.subs.length - 1}
                        onUp={() => move.mutate(reorderUpdates(g.subs, si, -1))}
                        onDown={() => move.mutate(reorderUpdates(g.subs, si, 1))}
                        onToggleHome={(show) => toggleHome.mutate({ id: s.id, show })}
                        onEdit={() =>
                          setDraft({
                            id: s.id,
                            main_category: s.main_category,
                            name: s.name,
                            isMain: false,
                            emoji: s.emoji,
                            image_url: s.image_url ?? "",
                            show_on_home: s.show_on_home,
                            sort_order: s.sort_order,
                          })
                        }
                        onDelete={() => askDelete(s, 0)}
                      />
                    </li>
                  ))}
                </ol>
                {!locked && (
                  <div className="border-t border-border px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          main_category: g.main.main_category,
                          name: "",
                          isMain: false,
                          emoji: "",
                          image_url: "",
                          show_on_home: false,
                          sort_order: ((g.subs.at(-1)?.sort_order ?? 0) + 1),
                        })
                      }
                    >
                      <Plus /> Add subcategory
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <CategoryDialog draft={draft} saving={save.isPending} onClose={() => setDraft(null)} onSave={(d) => save.mutate(d)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? deleting.name || deleting.main_category : ""} will be removed. It has no products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending && <Loader2 className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryRow(props: {
  category: Category;
  label: string;
  count: number;
  main?: boolean;
  locked?: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onToggleHome: (show: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { category: c, label, count, main, locked } = props;
  const image = c.image_url && isValidHttpUrl(c.image_url) ? c.image_url : "";
  return (
    <div className={main ? "flex flex-wrap items-center gap-3 px-4 py-3" : "flex flex-wrap items-center gap-3 py-2 pr-4 pl-10"}>
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-tile text-lg">
        {image ? <img src={image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : c.emoji || DEFAULT_EMOJI}
      </span>
      <div className="min-w-0 flex-1">
        <p className={main ? "font-semibold" : "text-sm"}>{label}</p>
        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "product" : "products"}
        </p>
      </div>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Switch
          checked={c.show_on_home}
          onCheckedChange={props.onToggleHome}
          aria-label={`Show ${label} on the home page`}
        />
        Home
      </label>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" disabled={!props.canUp} onClick={props.onUp} aria-label={`Move ${label} up`}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" disabled={!props.canDown} onClick={props.onDown} aria-label={`Move ${label} down`}>
          <ArrowDown />
        </Button>
        {locked ? (
          <Badge variant="soft" className="ml-1 rounded-full">Default</Badge>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={props.onEdit} aria-label={`Edit ${label}`}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onDelete}
              aria-label={`Delete ${label}`}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryDialog({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft | null;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {draft && <CategoryDialogBody key={draft.id ?? `new-${draft.main_category}`} draft={draft} saving={saving} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialogBody({
  draft,
  saving,
  onClose,
  onSave,
}: {
  draft: Draft;
  saving: boolean;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState(draft);
  const [error, setError] = useState("");
  const nameValue = d.isMain ? d.main_category : d.name;

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = nameValue.trim();
    if (!name || name.length > 60) return setError("Enter a name (up to 60 characters).");
    if (d.isMain && name.toLowerCase() === UNCATEGORISED.toLowerCase() && !draft.id) return setError("That name is reserved.");
    if (d.image_url.trim() && !isValidHttpUrl(d.image_url)) return setError("Enter a valid image link starting with https://");
    setError("");
    onSave(d);
  }

  const image = isValidHttpUrl(d.image_url) ? d.image_url.trim() : "";
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <DialogHeader>
        <DialogTitle>
          {draft.id ? "Edit" : "Add"} {d.isMain ? "main category" : "subcategory"}
        </DialogTitle>
        <DialogDescription>
          {d.isMain ? "Renaming moves its products and subcategories along." : `In ${d.main_category}. Renaming moves its products along.`}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-start gap-4">
        <span className="relative mt-6 rounded-full bg-gradient-ring p-[2px]">
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-gradient-tile text-2xl">
            {image ? <img src={image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : d.emoji || DEFAULT_EMOJI}
          </span>
        </span>
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={nameValue}
              maxLength={60}
              onChange={(e) => setD(d.isMain ? { ...d, main_category: e.target.value } : { ...d, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-emoji">Emoji (shown when there's no image)</Label>
            <Input id="cat-emoji" value={d.emoji} maxLength={8} onChange={(e) => setD({ ...d, emoji: e.target.value })} placeholder="🎧" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-image">Image link (optional)</Label>
        <Input
          id="cat-image"
          type="url"
          value={d.image_url}
          onChange={(e) => setD({ ...d, image_url: e.target.value })}
          placeholder="https://…"
        />
        <p className="text-xs text-muted-foreground">Paste an image address — images are never uploaded.</p>
      </div>
      <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
        Show on the home page
        <Switch checked={d.show_on_home} onCheckedChange={(v) => setD({ ...d, show_on_home: v })} />
      </label>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
