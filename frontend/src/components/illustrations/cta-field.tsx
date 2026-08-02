import { cn } from "@utils";

/**
 * Texture for the call-to-action band. This one stays geometric: a detailed
 * illustration knocked back to low opacity over a saturated background just
 * reads as noise. Inherits the band's colour through `stroke-current`.
 */
export function CtaFieldArt({ className }: { className?: string }) {
  const rows = [30, 75, 120, 165, 210];
  const cols = [25, 75, 125, 175, 225, 275, 325, 375];
  return (
    <svg
      viewBox="0 0 400 225"
      fill="none"
      strokeWidth={2}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
    >
      {rows.map((cy, r) =>
        cols.map((cx, c) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={6 + ((r + c) % 3) * 5}
            className="stroke-current"
          />
        )),
      )}
    </svg>
  );
}
