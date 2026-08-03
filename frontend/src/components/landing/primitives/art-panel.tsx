import { Illustration } from "@components/illustrations";
import type {
  Illustration as IllustrationAsset,
  IllustrationTint,
} from "@constants/shared/illustration";
import { cn } from "@utils";

/**
 * Written out in full rather than composed, because Tailwind extracts class
 * names statically and would not see `bg-tint-${tint}`.
 */
export const TINT_PANEL: Record<IllustrationTint, string> = {
  cyan: "bg-tint-cyan",
  violet: "bg-tint-violet",
  blue: "bg-tint-blue",
  mint: "bg-tint-mint",
  amber: "bg-tint-amber",
  rose: "bg-tint-rose",
  coral: "bg-tint-coral",
};

interface ArtPanelProps {
  art: IllustrationAsset;
  /** Tailwind aspect utility, e.g. `aspect-[16/10]`. */
  aspect: string;
  className?: string;
  artClassName?: string;
}

/**
 * An illustration on its matching tinted ground. These panels previously sat on
 * ink, which suited a single muted accent but hides the light structure the
 * retinted art is built from.
 */
export function ArtPanel({
  art,
  aspect,
  className,
  artClassName,
}: ArtPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspect,
        art.tint ? TINT_PANEL[art.tint] : "bg-paper-sunk",
        className,
      )}
    >
      <Illustration art={art} className={cn("p-6", artClassName)} />
    </div>
  );
}
