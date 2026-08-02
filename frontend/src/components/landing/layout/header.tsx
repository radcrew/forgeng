import Link from "next/link";

import { Logo } from "@components/brand/logo";
import { NAV_LINKS } from "@constants/landing";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={26} priority />
          <span className="u-display text-lg">Forgeng</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="u-tech text-[0.625rem] text-steel transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/sign-in"
            className="u-tech hidden text-[0.625rem] text-steel transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-[3px] bg-ink px-4 text-xs font-semibold text-paper transition-colors hover:bg-quench hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Apply
          </Link>
        </div>
      </div>
    </header>
  );
}
