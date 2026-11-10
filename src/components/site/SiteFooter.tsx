import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";

const STEPS = [
  { n: "1", title: "Watch the reel", text: "Every product is tested on camera." },
  { n: "2", title: "Tap the link", text: "“Click here for your link” opens Amazon." },
  { n: "3", title: "Buy on Amazon", text: "You finish your purchase on Amazon." },
];

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-sm font-bold">
            How it works
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-xs font-bold text-gold-foreground">
                  {s.n}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{s.title}</span>
                  <span className="block text-xs text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Wordmark className="text-2xl" />
          <p className="text-sm text-muted-foreground">Vetted products. Real reviews.</p>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
            <Link to="/browse" className="hover:text-gold">Browse</Link>
            <Link to="/list" className="hover:text-gold">My list</Link>
            <Link to="/about" className="hover:text-gold">About</Link>
            <Link to="/contact" className="hover:text-gold">Contact</Link>
          </nav>
          <p className="max-w-md text-xs text-muted-foreground">
            Links are Amazon affiliate links — I may earn a small commission at no extra cost to you.
          </p>
          <p className="text-xs text-muted-foreground">
            © Vettly. As an Amazon Associate I earn from qualifying purchases.
          </p>
        </div>
      </div>
    </footer>
  );
}
