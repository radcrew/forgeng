"use client";

import { format, isAfter, parseISO } from "date-fns";
import { CheckCircle2, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { RadialProgress } from "@components/common";
import type { MonthlyPayment } from "@types";

export type PaymentProgressProps = {
  monthlyPayment: MonthlyPayment;
  stipendAmount: string | null;
};

export const PaymentProgress = ({ monthlyPayment, stipendAmount }: PaymentProgressProps) => {
  const { tasksThisMonth, approvedThisMonth, paymentDate, eligible } =
    monthlyPayment;

  const progressPercent =
    tasksThisMonth > 0
      ? Math.round((approvedThisMonth / tasksThisMonth) * 100)
      : 0;

  const remaining = tasksThisMonth - approvedThisMonth;
  const paymentDateObj = parseISO(paymentDate);
  const paymentDateFormatted = format(paymentDateObj, "MMMM d");
  const pastPaymentDate = isAfter(new Date(), paymentDateObj);

  let headline: string;
  let subtext: string;

  if (tasksThisMonth === 0) {
    headline = "No tasks due this month";
    subtext = "Check back when new tasks are published.";
  } else if (eligible) {
    headline = "You've earned this month's stipend!";
    subtext = pastPaymentDate
      ? "Your payment is being processed — expect it within 2 business days."
      : `Your payment will be sent within 2 business days of ${paymentDateFormatted}.`;
  } else {
    const taskWord = remaining === 1 ? "task" : "tasks";
    headline =
      remaining === tasksThisMonth
        ? `Complete your ${tasksThisMonth} ${taskWord} to earn this month's stipend`
        : `${remaining} ${taskWord} left to unlock your monthly stipend`;
    subtext = `Payment releases on ${paymentDateFormatted} — keep going!`;
  }

  const radialLabel =
    tasksThisMonth === 0 ? "—" : `${approvedThisMonth}/${tasksThisMonth}`;

  return (
    <Card className={eligible ? "border-primary/60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Monthly Stipend
            {stipendAmount && (
              <span className="text-xs font-semibold text-foreground">
                ${stipendAmount} USD
              </span>
            )}
          </CardTitle>
          {eligible && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Eligible
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <RadialProgress
              percent={progressPercent}
              label={radialLabel}
              active={eligible}
            />
          </div>
          <div className="space-y-1 min-w-0">
            <p
              className={`text-sm font-medium leading-snug ${eligible ? "text-primary" : "text-foreground"}`}
            >
              {headline}
            </p>
            <p className="text-xs text-muted-foreground leading-snug">
              {subtext}
            </p>
            {tasksThisMonth > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                {progressPercent}% complete
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
