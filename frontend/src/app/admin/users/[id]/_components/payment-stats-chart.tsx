"use client";

import { format, parse } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import type { MonthlyPaymentStat } from "@features/users/api";

const BAR_WIDTH = 32;
const BAR_GAP = 16;
const CHART_HEIGHT = 100;
const LABEL_HEIGHT = 20;
const SVG_HEIGHT = CHART_HEIGHT + LABEL_HEIGHT + 8;

function barColor(stat: MonthlyPaymentStat): string {
  if (stat.tasksTotal === 0) return "hsl(var(--muted))";
  if (stat.eligible) return "hsl(var(--primary))";
  return "hsl(var(--primary) / 0.4)";
}

export function PaymentStatsChart({ stats }: { stats: MonthlyPaymentStat[] }) {
  const svgWidth =
    stats.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP + 2;

  return (
    <div className="space-y-3">
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
        className="overflow-visible"
        aria-label="Monthly payment progress chart"
      >
        {stats.map((stat, i) => {
          const x = i * (BAR_WIDTH + BAR_GAP);
          const pct =
            stat.tasksTotal > 0
              ? stat.tasksApproved / stat.tasksTotal
              : 0;
          const barH = Math.max(pct > 0 ? 4 : 2, Math.round(pct * CHART_HEIGHT));
          const barY = CHART_HEIGHT - barH;
          const label = format(
            parse(stat.month, "yyyy-MM", new Date()),
            "MMM",
          );

          return (
            <g key={stat.month}>
              {/* background track */}
              <rect
                x={x}
                y={0}
                width={BAR_WIDTH}
                height={CHART_HEIGHT}
                rx={6}
                className="fill-muted"
              />
              {/* filled bar */}
              <rect
                x={x}
                y={barY}
                width={BAR_WIDTH}
                height={barH}
                rx={6}
                fill={barColor(stat)}
              />
              {/* month label */}
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + LABEL_HEIGHT}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {stats.map((stat) => {
          const label = format(
            parse(stat.month, "yyyy-MM", new Date()),
            "MMM yyyy",
          );
          return (
            <div key={stat.month} className="flex items-center gap-1.5">
              {stat.eligible ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-sm bg-muted inline-block shrink-0" />
              )}
              <span className="text-xs text-muted-foreground">
                {label}
                {stat.tasksTotal > 0 && (
                  <span className="ml-1 text-foreground">
                    {stat.tasksApproved}/{stat.tasksTotal}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
