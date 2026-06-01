import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo } from "@components/brand/logo";
import { Button } from "@components/ui/button";
import { NAV_LINKS } from "@constants/landing";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Logo size={28} priority />
        <span className="font-bold text-lg tracking-tight">Forgeng</span>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="text-sm font-medium hover:text-primary transition-colors hidden sm:block"
        >
          Sign In
        </Link>
        <Button asChild size="sm" className="font-semibold">
          <Link href="/sign-up">
            Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
