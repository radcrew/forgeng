import Link from "next/link";

import { Logo } from "@components/brand/logo";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold text-sm">Forgeng</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built for engineers who are serious about getting better.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link
            href="/apply"
            className="hover:text-foreground transition-colors"
          >
            Apply
          </Link>
          <Link
            href="/sign-in"
            className="hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
