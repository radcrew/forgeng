import Link from "next/link";

import { Logo } from "@components/brand/logo";
import { NAV_LINKS } from "@constants/landing/nav-links";
import { SOCIAL_LINKS } from "@constants/landing/social-links";

const LEGAL = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    // Asymmetric padding: the top still opens against the CTA band above, but
    // the baseline row is the last thing on the page and does not need another
    // 112px beneath it.
    <footer className="bg-ink px-8 pb-10 pt-24 text-paper lg:px-12 lg:pb-12 lg:pt-28">
      <div className="mx-auto max-w-[88rem]">
        {/* Three columns rather than four. Legal held two links against
            Explore's five, so it left a tall gap under itself; those two links
            now sit in the baseline row, which had a whole empty side. */}
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="u-title text-lg text-paper">Forgeng</span>
            </div>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">
              A mentor-led apprenticeship where you earn while you learn.
            </p>
          </div>

          <div>
            <p className="u-tech text-[0.75rem] text-white/60">Explore</p>
            <ul className="mt-5 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-base text-white/70 transition-colors hover:text-quench"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="u-tech text-[0.75rem] text-white/60">Contact</p>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="mailto:hello@forgeng.com"
                  className="text-base text-white/70 transition-colors hover:text-quench"
                >
                  hello@forgeng.com
                </a>
              </li>
              {SOCIAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-white/70 transition-colors hover:text-quench"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Baseline row: the notice holds the left, the legal links the right,
            so the bar carries something across its full width. */}
        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="u-tech text-[0.75rem] text-white/55">
            © {year} Forgeng
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="u-tech text-[0.75rem] text-white/55 transition-colors hover:text-quench"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
