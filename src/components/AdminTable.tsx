import { format } from "date-fns";
import { ImageOff, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/lib/products";

export function AdminTable({
  products,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onTogglePublished: (p: Product, published: boolean) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Episode</TableHead>
            <TableHead className="w-16">Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Brand</TableHead>
            <TableHead className="hidden md:table-cell">Date added</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id} className={p.published ? undefined : "opacity-60"}>
              <TableCell>
                <Badge variant="gold" className="rounded-full">
                  {p.episode}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
                  ) : (
                    <ImageOff className="size-4 text-muted-foreground" aria-label="No photo" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {p.name}
                <span className="block text-xs text-muted-foreground sm:hidden">{p.brand}</span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{p.brand}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {format(new Date(p.created_at), "d MMM yyyy")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.published}
                    onCheckedChange={(v) => onTogglePublished(p, v)}
                    aria-label={`${p.published ? "Hide" : "Publish"} ${p.name}`}
                  />
                  <span className="hidden text-xs text-muted-foreground lg:inline">
                    {p.published ? "Live" : "Hidden"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Button variant="ghost" size="icon" onClick={() => onEdit(p)} aria-label={`Edit ${p.name}`}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(p)}
                  aria-label={`Delete ${p.name}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
