import { cn } from "@utils";

/**
 * Marketing illustrations for the landing page. Same stroke language as the
 * in-app spot art, but composed at panel scale and fully populated: on the
 * marketing page the content exists, so nothing here is dashed.
 *
 * These stay abstract on purpose. A drawn imitation of the product UI reads
 * as a fake screenshot, which is worse than no image at all.
 */
export type SceneIllustration = React.ComponentType<{ className?: string }>;

const PLATE = "fill-muted/30";
const CARD = "fill-card";
const EDGE = "stroke-muted-foreground/15";
const INK = "fill-muted-foreground/20";
const RULE = "stroke-muted-foreground/15";
const SOFT = "fill-primary/10";
const TINT = "fill-primary/12";
const EDGE_ON = "stroke-primary/40";
const LINE_ON = "stroke-primary";
const SOLID_ON = "fill-primary";

function Scene({
  viewBox,
  children,
  className,
}: {
  viewBox: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
    >
      {children}
    </svg>
  );
}

/** Hero: three rising planes joined by a climbing path. */
export function HeroScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 300" className={className}>
      <rect width="400" height="300" className={PLATE} />
      <circle cx="300" cy="95" r="95" className={SOFT} />

      <rect x="56" y="190" width="74" height="74" rx="18" className={CARD} />
      <rect x="56" y="190" width="74" height="74" rx="18" className={EDGE} />
      <rect x="163" y="140" width="74" height="124" rx="18" className={CARD} />
      <rect x="163" y="140" width="74" height="124" rx="18" className={EDGE} />
      <rect x="270" y="86" width="74" height="178" rx="18" className={TINT} />
      <rect x="270" y="86" width="74" height="178" rx="18" className={EDGE_ON} />

      <path
        d="M93 190 Q150 155 200 140 T307 86"
        strokeWidth="3"
        className={LINE_ON}
      />
      <circle cx="93" cy="190" r="9" className={CARD} />
      <circle cx="93" cy="190" r="9" className={EDGE_ON} />
      <circle cx="200" cy="140" r="9" className={CARD} />
      <circle cx="200" cy="140" r="9" className={EDGE_ON} />
      <circle cx="307" cy="86" r="11" className={SOLID_ON} />

      <rect x="40" y="270" width="320" height="3" rx="2" className={INK} />
    </Scene>
  );
}

/** Mission: the task, submission and verdict chain. */
export function MissionScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 320 400" className={className}>
      <rect width="320" height="400" className={PLATE} />
      <circle cx="160" cy="200" r="132" className={SOFT} />

      {/* The chain sits high: an overlay card covers the bottom ~18% of this
          panel on the page. */}
      <path d="M160 82 V270" strokeWidth="2" className={RULE} />

      <circle cx="160" cy="82" r="30" className={CARD} />
      <circle cx="160" cy="82" r="30" className={EDGE} />
      <rect x="148" y="74" width="24" height="16" rx="4" className={INK} />

      <circle cx="160" cy="176" r="30" className={CARD} />
      <circle cx="160" cy="176" r="30" className={EDGE} />
      <path d="M160 186 V166 M152 174 L160 166 L168 174" className={RULE} />

      <circle cx="160" cy="270" r="36" className={TINT} />
      <circle cx="160" cy="270" r="36" className={EDGE_ON} />
      <path
        d="M145 270 L156 281 L177 259"
        strokeWidth="3.5"
        className={LINE_ON}
      />
    </Scene>
  );
}

/** Mentor feedback: two exchanges and a verdict. */
export function FeedbackScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 300" className={className}>
      <rect width="400" height="300" className={PLATE} />

      <rect x="40" y="52" width="196" height="86" rx="16" className={CARD} />
      <rect x="40" y="52" width="196" height="86" rx="16" className={EDGE} />
      <path d="M64 138 V158 L86 138" className={EDGE} />
      <rect x="62" y="76" width="150" height="9" rx="4.5" className={INK} />
      <rect x="62" y="95" width="112" height="9" rx="4.5" className={INK} />
      <rect x="62" y="114" width="132" height="9" rx="4.5" className={INK} />

      {/* Kept clear of the bottom ~23%, where the quote card sits on the page. */}
      <rect x="150" y="146" width="200" height="72" rx="16" className={TINT} />
      <rect x="150" y="146" width="200" height="72" rx="16" className={EDGE_ON} />
      <rect
        x="172"
        y="168"
        width="152"
        height="9"
        rx="4.5"
        className="fill-primary/30"
      />
      <rect
        x="172"
        y="187"
        width="104"
        height="9"
        rx="4.5"
        className="fill-primary/20"
      />

      <circle cx="322" cy="86" r="34" className={CARD} />
      <circle cx="322" cy="86" r="34" className={EDGE_ON} />
      <path
        d="M306 86 L317 97 L340 73"
        strokeWidth="3.5"
        className={LINE_ON}
      />
    </Scene>
  );
}

/** A field of rings for the call-to-action band. Inherits the parent colour. */
export function CtaFieldScene({ className }: { className?: string }) {
  const rows = [30, 75, 120, 165, 210];
  const cols = [25, 75, 125, 175, 225, 275, 325, 375];
  return (
    <Scene viewBox="0 0 400 225" className={className}>
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
    </Scene>
  );
}

/** Step 01 — an application arriving. */
export function StepApplyScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      <rect x="112" y="42" width="180" height="166" rx="16" className={CARD} />
      <rect x="112" y="42" width="180" height="166" rx="16" className={EDGE} />
      <rect x="136" y="76" width="132" height="10" rx="5" className={INK} />
      <rect x="136" y="100" width="100" height="10" rx="5" className={INK} />
      <rect x="136" y="124" width="120" height="10" rx="5" className={INK} />
      <rect x="136" y="156" width="84" height="24" rx="12" className={TINT} />
      <rect x="136" y="156" width="84" height="24" rx="12" className={EDGE_ON} />
      <path
        d="M36 125 H98 M84 111 L98 125 L84 139"
        strokeWidth="3"
        className={LINE_ON}
      />
    </Scene>
  );
}

/** Step 02 — a cohort forming around a mentor. */
export function StepCohortScene({ className }: { className?: string }) {
  const satellites = [0, 1, 2, 3, 4, 5].map((i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return {
      x: 200 + Math.cos(angle) * 82,
      y: 125 + Math.sin(angle) * 82,
    };
  });
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      {satellites.map((s) => (
        <path
          key={`edge-${s.x}`}
          d={`M200 125 L${s.x} ${s.y}`}
          className={RULE}
        />
      ))}
      {satellites.map((s) => (
        <g key={`node-${s.x}`}>
          <circle cx={s.x} cy={s.y} r="17" className={CARD} />
          <circle cx={s.x} cy={s.y} r="17" className={EDGE} />
        </g>
      ))}
      <circle cx="200" cy="125" r="28" className={TINT} />
      <circle cx="200" cy="125" r="28" className={EDGE_ON} />
    </Scene>
  );
}

/** Step 03 — tasks being worked through. */
export function StepTasksScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      {[52, 100, 148].map((y, i) => (
        <g key={y}>
          <rect x="88" y={y} width="224" height="36" rx="12" className={CARD} />
          <rect x="88" y={y} width="224" height="36" rx="12" className={EDGE} />
          <circle
            cx="112"
            cy={y + 18}
            r="11"
            className={i < 2 ? TINT : CARD}
          />
          <circle
            cx="112"
            cy={y + 18}
            r="11"
            className={i < 2 ? EDGE_ON : EDGE}
          />
          {i < 2 && (
            <path
              d={`M106 ${y + 18} L110 ${y + 22} L118 ${y + 13}`}
              className={LINE_ON}
            />
          )}
          <rect
            x="136"
            y={y + 13}
            width={i === 2 ? 96 : 132}
            height="10"
            rx="5"
            className={INK}
          />
        </g>
      ))}
      <rect x="88" y="200" width="224" height="10" rx="5" className={INK} />
      <rect x="88" y="200" width="149" height="10" rx="5" className={SOLID_ON} />
    </Scene>
  );
}

/** Step 04 — a mentor annotating the work. */
export function StepFeedbackScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      <rect x="56" y="44" width="172" height="162" rx="14" className={CARD} />
      <rect x="56" y="44" width="172" height="162" rx="14" className={EDGE} />
      {[70, 96, 148, 174].map((y) => (
        <rect
          key={y}
          x="78"
          y={y}
          width={y % 3 === 0 ? 108 : 128}
          height="9"
          rx="4.5"
          className={INK}
        />
      ))}
      <rect
        x="78"
        y="122"
        width="96"
        height="9"
        rx="4.5"
        className="fill-primary/30"
      />
      <path d="M244 128 L228 138 L244 148" className={EDGE_ON} />
      <rect x="244" y="90" width="112" height="70" rx="14" className={TINT} />
      <rect x="244" y="90" width="112" height="70" rx="14" className={EDGE_ON} />
      <rect
        x="264"
        y="110"
        width="72"
        height="9"
        rx="4.5"
        className="fill-primary/30"
      />
      <rect
        x="264"
        y="129"
        width="52"
        height="9"
        rx="4.5"
        className="fill-primary/20"
      />
    </Scene>
  );
}

/** Step 05 — the monthly stipend. */
export function StepStipendScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      {/* Side walls close the stack into a cylinder so it reads as coins. */}
      <path d="M100 146 V186 M216 146 V186" className={EDGE} />
      {[186, 166, 146].map((cy, i) => (
        <g key={cy}>
          <ellipse
            cx="158"
            cy={cy}
            rx="58"
            ry="17"
            className={i === 2 ? TINT : CARD}
          />
          <ellipse
            cx="158"
            cy={cy}
            rx="58"
            ry="17"
            className={i === 2 ? EDGE_ON : EDGE}
          />
        </g>
      ))}
      <circle cx="158" cy="146" r="13" className={EDGE_ON} />
      <path
        d="M232 150 L302 86 M284 86 H302 V104"
        strokeWidth="3"
        className={LINE_ON}
      />
    </Scene>
  );
}

/** Step 06 — measurable progress. */
export function StepLevelUpScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 250" className={className}>
      <rect width="400" height="250" className={PLATE} />
      {[
        [96, 158, 52],
        [156, 128, 82],
        [216, 96, 114],
      ].map(([x, y, h]) => (
        <g key={x}>
          <rect x={x} y={y} width="44" height={h} rx="10" className={CARD} />
          <rect x={x} y={y} width="44" height={h} rx="10" className={EDGE} />
        </g>
      ))}
      <rect x="276" y="60" width="44" height="150" rx="10" className={TINT} />
      <rect x="276" y="60" width="44" height="150" rx="10" className={EDGE_ON} />
      <circle cx="298" cy="40" r="11" className={SOLID_ON} />
      <rect x="86" y="212" width="244" height="3" rx="2" className={INK} />
    </Scene>
  );
}

/** Role banner — the applicant arriving. */
export function RoleApplicantScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 150" className={className}>
      <rect width="400" height="150" className={PLATE} />
      <rect x="212" y="26" width="148" height="98" rx="16" className={CARD} />
      <rect x="212" y="26" width="148" height="98" rx="16" className={EDGE} />
      <rect x="234" y="52" width="104" height="9" rx="4.5" className={INK} />
      <rect x="234" y="71" width="76" height="9" rx="4.5" className={INK} />
      <rect x="234" y="94" width="60" height="18" rx="9" className={TINT} />
      <path
        d="M44 75 H178 M164 61 L178 75 L164 89"
        strokeWidth="3"
        className={LINE_ON}
      />
    </Scene>
  );
}

/** Role banner — the student working through tasks. */
export function RoleStudentScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 150" className={className}>
      <rect width="400" height="150" className={PLATE} />
      {[36, 150, 264].map((x, i) => (
        <g key={x}>
          <rect x={x} y="34" width="100" height="82" rx="16" className={CARD} />
          <rect x={x} y="34" width="100" height="82" rx="16" className={EDGE} />
          <circle cx={x + 26} cy="60" r="12" className={i < 2 ? TINT : CARD} />
          <circle
            cx={x + 26}
            cy="60"
            r="12"
            className={i < 2 ? EDGE_ON : EDGE}
          />
          {i < 2 && (
            <path
              d={`M${x + 20} 60 L${x + 24} 64 L${x + 33} 55`}
              className={LINE_ON}
            />
          )}
          <rect
            x={x + 16}
            y="86"
            width="68"
            height="8"
            rx="4"
            className={INK}
          />
        </g>
      ))}
    </Scene>
  );
}

/** Role banner — the admin overseeing the program. */
export function RoleAdminScene({ className }: { className?: string }) {
  return (
    <Scene viewBox="0 0 400 150" className={className}>
      <rect width="400" height="150" className={PLATE} />
      <rect x="40" y="24" width="320" height="102" rx="16" className={CARD} />
      <rect x="40" y="24" width="320" height="102" rx="16" className={EDGE} />

      {/* A small read-out on the left, the roster on the right. */}
      {[
        [68, 82, 26],
        [94, 68, 40],
        [120, 50, 58],
      ].map(([x, y, h], i) => (
        <g key={x}>
          <rect
            x={x}
            y={y}
            width="18"
            height={h}
            rx="5"
            className={i === 2 ? TINT : CARD}
          />
          <rect
            x={x}
            y={y}
            width="18"
            height={h}
            rx="5"
            className={i === 2 ? EDGE_ON : EDGE}
          />
        </g>
      ))}
      <rect x="66" y="112" width="86" height="3" rx="2" className={INK} />

      <rect x="178" y="48" width="148" height="10" rx="5" className={INK} />
      <rect x="178" y="70" width="112" height="10" rx="5" className={INK} />
      <rect x="178" y="92" width="76" height="10" rx="5" className={SOLID_ON} />
    </Scene>
  );
}
