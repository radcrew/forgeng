import Image from "next/image";

import type { Illustration as IllustrationAsset } from "@constants/shared/illustration";
import { cn } from "@utils";

interface IllustrationProps {
  art: IllustrationAsset;
  /**
   * Decorative by default — every placement sits beside a heading or message
   * that already carries the meaning, so a description would just repeat it.
   */
  alt?: string;
  className?: string;
}

export function Illustration({ art, alt = "", className }: IllustrationProps) {
  return (
    <Image
      src={art.src}
      alt={alt}
      width={art.width}
      height={art.height}
      // SVG gains nothing from the resizing pipeline, and skipping it avoids
      // enabling `dangerouslyAllowSVG` across the whole app.
      unoptimized
      className={cn("h-full w-full object-contain", className)}
    />
  );
}
