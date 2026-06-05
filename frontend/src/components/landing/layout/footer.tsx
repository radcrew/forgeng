import { Logo } from "@components/brand/logo";
import { NAV_LINKS } from "@constants/landing/nav-links";
import { SOCIAL_LINKS } from "@constants/landing/social-links";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <Logo size={22} />
              <span className="font-semibold text-sm">Forgeng</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A rigorous, mentor-led apprenticeship where you earn while you learn.
            </p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Contact
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@forgeng.com"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  hello@forgeng.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center">
            © {year} Forgeng. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
