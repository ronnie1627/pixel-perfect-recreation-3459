import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut, Plus, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminTable } from "@/components/AdminTable";
import { ProductForm, type ProductInput } from "@/components/ProductForm";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ADMIN_PAGE_SIZE, fetchProductPage, type Product, type StatusFilter } from "@/lib/products";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin – Vettly" },
      { name: "description", content: "Private dashboard for managing Vettly products." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin – Vettly" },
      { property: "og:description", content: "Private dashboard for managing Vettly products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type SessionState =
  | { state: "signed_out" }
  | { state: "forbidden" }
  | { state: "admin"; email: string };

const SESSION_KEY = ["admin-session"] as const;

function AdminPage() {
  const navigate = useNavigate();
  const session = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<SessionState> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { state: "signed_out" };
      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return isAdmin ? { state: "admin", email: user.email ?? "" } : { state: "forbidden" };
    },
  });

  // Anyone signed in who isn't the admin is signed out and sent away.
  useEffect(() => {
    if (session.data?.state !== "forbidden") return;
    void supabase.auth.signOut().then(() => {
      toast.error("This account doesn't have admin access.");
      void navigate({ to: "/", replace: true });
    });
  }, [session.data, navigate]);

  if (session.isPending || session.data?.state === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (session.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium">Couldn't check your session.</p>
          <Button className="mt-4" variant="outline" onClick={() => session.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
  if (session.data.state === "signed_out") return <AdminLogin />;
  return <Dashboard email={session.data.email} />;
}

/* ------------------------------- Login ------------------------------- */

function AdminLogin() {
  const queryClient = useQueryClient();
  const adminExists = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) throw error;
      return Boolean(data);
    },
  });
  const setupMode = adminExists.data === false;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < (setupMode ? 8 : 1)) {
      toast.error(setupMode ? "Use a valid email and a password of 8+ characters." : "Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (setupMode) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["admin-exists"] });
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-6 text-center">
          <Wordmark className="text-3xl" />
          <h1 className="mt-3 text-lg font-bold">
            {setupMode ? "Create your admin account" : "Admin sign in"}
          </h1>
          {setupMode && (
            <p className="mt-1 text-sm text-muted-foreground">
              This is a one-time setup. After this, sign-ups are closed for good.
            </p>
          )}
        </div>

        {checkEmail ? (
          <p className="rounded-lg bg-gold-soft p-4 text-center text-sm">
            Check your inbox to confirm your email, then come back to this page to sign in.
          </p>
        ) : adminExists.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={setupMode ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {setupMode ? "Create admin account" : "Sign in"}
            </Button>
          </form>
        )}
      </div>
      <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back to Vettly
      </Link>
    </div>
  );
}

/* ----------------------------- Dashboard ----------------------------- */

function Dashboard({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input), 250);
    return () => clearTimeout(t);
  }, [input]);

  const list = useInfiniteQuery({
    queryKey: ["products", "admin", query, status],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchProductPage({ query, sort: "newest", offset: pageParam, pageSize: ADMIN_PAGE_SIZE, status }),
    getNextPageParam: (last) => last.nextOffset,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const save = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ProductInput }) => {
      const { error } = id
        ? await supabase.from("products").update(input).eq("id", id)
        : await supabase.from("products").insert(input);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? "Product updated" : "Product added");
      setFormOpen(false);
      setEditing(null);
      void refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't save product."),
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from("products").update({ published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.published ? "Product is live" : "Product hidden");
      void refresh();
    },
    onError: () => toast.error("Couldn't update visibility."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleting(null);
      void refresh();
    },
    onError: () => toast.error("Couldn't delete product."),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.removeQueries({ queryKey: ["products"] });
    await supabase.auth.signOut();
    queryClient.setQueryData(SESSION_KEY, { state: "signed_out" } satisfies SessionState);
    void navigate({ to: "/admin", replace: true });
  }

  const products = list.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = list.data?.pages[0]?.count ?? 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Wordmark className="text-xl" />
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <Button variant="ghost" size="icon" asChild aria-label="View public site">
              <Link to="/" target="_blank">
                <ExternalLink />
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {list.isPending ? "Loading…" : `${total} ${total === 1 ? "product" : "products"}`}
            </p>
          </div>
          <Button
            variant="gold"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add product
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            size="md"
            value={input}
            onChange={setInput}
            className="flex-1"
            label="Filter products"
          />
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="hidden">Hidden</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-4">
          {list.isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
            </div>
          ) : list.isError ? (
            <div className="rounded-xl border border-border p-8 text-center">
              <p>Couldn't load products.</p>
              <Button variant="outline" className="mt-3" onClick={() => list.refetch()}>
                Try again
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No products found.
            </div>
          ) : (
            <>
              <AdminTable
                products={products}
                onEdit={(p) => {
                  setEditing(p);
                  setFormOpen(true);
                }}
                onDelete={setDeleting}
                onTogglePublished={(p, published) => togglePublished.mutate({ id: p.id, published })}
              />
              {list.hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => list.fetchNextPage()}
                    disabled={list.isFetchingNextPage}
                  >
                    {list.isFetchingNextPage && <Loader2 className="animate-spin" />}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Paste the full reel link — only the reel code is stored.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            key={editing?.id ?? "new"}
            initial={editing}
            submitting={save.isPending}
            onCancel={() => setFormOpen(false)}
            onSubmit={(input) => save.mutate({ id: editing?.id, input })}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `Ep. ${deleting.episode} – ${deleting.name}` : ""} will be removed for
              good. To keep it but take it off the site, hide it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleting) remove.mutate(deleting.id);
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
