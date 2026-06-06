"use client";

import { format, parse } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import type { MonthlyPaymentStat } from "@features/users/api";

export function PaymentStatsChart({ stats }: { stats: MonthlyPaymentStat[] }) {
  return (
    <div className="space-y-2.5">
      {stats.map((stat) => {
        const pct =
          stat.tasksTotal > 0
            ? Math.round((stat.tasksApproved / stat.tasksTotal) * 100)
            : 0;

        const label = format(
          parse(stat.month, "yyyy-MM", new Date()),
          "MMM yy",
        );

        return (
          <div key={stat.month} className="space-y-1">
            <div className="grid grid-cols-[56px_1fr_auto] items-center gap-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {label}
              </span>

              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                {stat.tasksTotal > 0 && (
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      stat.eligible ? "bg-primary" : "bg-primary/40"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5 justify-end min-w-[64px]">
                {stat.tasksTotal === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : stat.eligible ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {stat.tasksApproved}/{stat.tasksTotal}
                  </span>
                )}
              </div>
            </div>

            {stat.payment && (
              <div className="ml-[64px] flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {stat.payment.amount} {stat.payment.currency} paid
                </span>
                {stat.payment.txLink && (
                  <a
                    href={stat.payment.txLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors truncate max-w-[160px]"
                    title={stat.payment.txLink}
                  >
                    View transaction
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
