const RADIUS = 38;
const STROKE = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

export interface RadialProgressProps {
  percent: number;
  label: string;
  active?: boolean;
}

export function RadialProgress({ percent, label, active }: RadialProgressProps) {
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="-rotate-90"
      aria-hidden
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        className="stroke-muted"
      />
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={`transition-all duration-700 ${active ? "stroke-primary-strong" : "stroke-primary-strong/60"}`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%" }}
      >
        <tspan
          x="50%"
          dy="-0.1em"
          className="fill-foreground"
          style={{ fontSize: 13, fontWeight: 700 }}
        >
          {label}
        </tspan>
      </text>
    </svg>
  );
}
