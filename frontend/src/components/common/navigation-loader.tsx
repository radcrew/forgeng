"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@components/brand/logo";

export function NavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const prevPathname = useRef(pathname);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation completed — fade out then unmount
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    setFading(true);
    fadeTimer.current = setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 250);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  // Intercept link clicks to detect navigation start
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      const targetPath = href.split("?")[0].split("#")[0];
      const currentPath = window.location.pathname;
      if (targetPath === currentPath) return;

      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setFading(false);
      setVisible(true);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-250 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-background px-10 py-8 shadow-xl">
        <Logo size={44} priority />
        <div className="h-5 w-5 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    </div>
  );
}
