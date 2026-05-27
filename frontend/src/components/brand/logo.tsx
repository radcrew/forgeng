import Image from "next/image";

import { cn } from "@utils";

interface LogoProps {
  /** Rendered size in px. Defaults to 28 (matches the landing header). */
  size?: number;
  className?: string;
  /** When true, mark as a high-priority image for above-the-fold use. */
  priority?: boolean;
}

/**
 * The Forgeng brand mark. Reads from `public/logo.png` so the same asset
 * powers favicons in `public/` and the OG image without duplication.
 */
export function Logo({ size = 28, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Forgeng logo"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-md", className)}
    />
  );
}
