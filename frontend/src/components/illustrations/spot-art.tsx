import { cn } from "@utils";

/**
 * Spot illustrations for zero-data states. Built from the product's own
 * vocabulary — task rows, cohort seats, verdicts, timelines — rather than
 * figurative drawing, so they stay consistent and inherit the theme.
 *
 * One rule holds the set together: solid muted strokes are structure that
 * exists, dashed primary strokes are the slot waiting to be filled.
 */
export type SpotIllustration = React.ComponentType<{ className?: string }>;

const MUTED = "stroke-muted-foreground/30";
const FAINT = "stroke-muted-foreground/20";
const ACCENT = "stroke-primary/50";
const DASH = "4 4";

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-20 w-20", className)}
    >
      {children}
    </svg>
  );
}

/** A task list with nothing scheduled in it. */
export function TaskListArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="14" y="22" width="68" height="52" rx="6" className={MUTED} />
      <rect
        x="24"
        y="34"
        width="48"
        height="12"
        rx="3"
        strokeDasharray={DASH}
        className={ACCENT}
      />
      <rect
        x="24"
        y="52"
        width="48"
        height="12"
        rx="3"
        strokeDasharray={DASH}
        className={FAINT}
      />
    </Frame>
  );
}

/** Cohort seats, none of them taken. */
export function CohortSeatsArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="14" y="24" width="68" height="48" rx="6" className={FAINT} />
      {[
        [31, 40],
        [48, 40],
        [65, 40],
        [31, 58],
        [48, 58],
        [65, 58],
      ].map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="7"
          strokeDasharray={DASH}
          className={i === 0 ? ACCENT : MUTED}
        />
      ))}
    </Frame>
  );
}

/** A filter that let nothing through. */
export function NoResultsArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M24 20 H72 L54 42 V62 L42 56 V42 Z" className={MUTED} />
      <rect
        x="38"
        y="70"
        width="20"
        height="8"
        rx="2"
        strokeDasharray={DASH}
        className={ACCENT}
      />
    </Frame>
  );
}

/** A record that could not be found. */
export function NotFoundArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect
        x="14"
        y="20"
        width="50"
        height="44"
        rx="5"
        strokeDasharray={DASH}
        className={MUTED}
      />
      <circle cx="60" cy="58" r="16" className={ACCENT} />
      <path d="M71.5 69.5 L80 78" className={ACCENT} />
    </Frame>
  );
}

/** Nothing submitted yet. */
export function SubmitArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path
        d="M18 60 V72 a4 4 0 0 0 4 4 H74 a4 4 0 0 0 4 -4 V60"
        className={MUTED}
      />
      <path d="M48 58 V22" strokeDasharray={DASH} className={ACCENT} />
      <path d="M36 34 L48 22 L60 34" className={ACCENT} />
    </Frame>
  );
}

/** No notifications have arrived. */
export function NotificationsArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      {[32, 48, 64].map((cy, i) => (
        <g key={cy}>
          <circle
            cx="26"
            cy={cy}
            r="5"
            strokeDasharray={DASH}
            className={i === 0 ? ACCENT : MUTED}
          />
          <path d={`M40 ${cy} H${72 - i * 8}`} className={FAINT} />
        </g>
      ))}
    </Frame>
  );
}

/** A stack of cohorts with room at the top. */
export function CohortLayersArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="20" y="58" width="56" height="13" rx="4" className={MUTED} />
      <rect x="26" y="42" width="44" height="13" rx="4" className={FAINT} />
      <rect
        x="32"
        y="26"
        width="32"
        height="13"
        rx="4"
        strokeDasharray={DASH}
        className={ACCENT}
      />
    </Frame>
  );
}

/** A submission with no verdict on it yet. */
export function VerdictArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="12" y="20" width="56" height="48" rx="5" className={MUTED} />
      <path d="M24 36 H56" className={FAINT} />
      <path d="M24 46 H48" className={FAINT} />
      <circle cx="68" cy="64" r="14" strokeDasharray={DASH} className={ACCENT} />
      <path d="M61 64 L66 69 L75 59" className="stroke-primary/25" />
    </Frame>
  );
}

/** An empty application tray. */
export function ApplicationsArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect
        x="32"
        y="16"
        width="32"
        height="34"
        rx="3"
        strokeDasharray={DASH}
        className={ACCENT}
      />
      <path d="M40 28 H56" className={FAINT} />
      <path d="M40 38 H50" className={FAINT} />
      <path
        d="M16 58 H32 L38 68 H58 L64 58 H80 V74 a4 4 0 0 1 -4 4 H20 a4 4 0 0 1 -4 -4 Z"
        className={MUTED}
      />
    </Frame>
  );
}

/** A cohort timeline with no milestones on it. */
export function TimelineArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M18 48 H78" className={FAINT} />
      {[28, 48, 68].map((cx, i) => (
        <circle
          key={cx}
          cx={cx}
          cy="48"
          r="7"
          strokeDasharray={DASH}
          className={i === 1 ? ACCENT : MUTED}
        />
      ))}
    </Frame>
  );
}

/** A path with a piece missing — the 404. */
export function BrokenPathArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <path d="M20 48 H38" className={MUTED} />
      <path d="M58 48 H76" className={MUTED} />
      <circle cx="20" cy="48" r="5" className={MUTED} />
      <circle cx="76" cy="48" r="5" className={MUTED} />
      <path d="M42 36 V60" strokeDasharray={DASH} className={ACCENT} />
      <path d="M54 36 V60" strokeDasharray={DASH} className={ACCENT} />
    </Frame>
  );
}

/** Progress that has not started. */
export function ProgressArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <circle cx="48" cy="48" r="24" strokeDasharray={DASH} className={MUTED} />
      <circle cx="48" cy="24" r="3.5" className={ACCENT} />
    </Frame>
  );
}
