"use client";

import { format } from "date-fns";
import { CheckCircle2, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Progress } from "@components/ui/progress";
import type { MonthlyPayment } from "@types";

export type PaymentProgressProps = { monthlyPayment: MonthlyPayment };

export const PaymentProgress = ({ monthlyPayment }: PaymentProgressProps) => {
  const { tasksThisMonth, approvedThisMonth, paymentDate, eligible } =
    monthlyPayment;

  const progressPercent =
    tasksThisMonth > 0
      ? Math.round((approvedThisMonth / tasksThisMonth) * 100)
      : 0;

  const paymentDateFormatted = format(new Date(paymentDate), "MMMM d, yyyy");

  return (
    <Card className={eligible ? "border-primary/60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Monthly Payment
          </CardTitle>
          {eligible && (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Eligible
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {eligible
            ? `You have completed all tasks due this month. Your payment will be released on ${paymentDateFormatted}.`
            : tasksThisMonth === 0
              ? `No tasks are due this month. Keep an eye out for upcoming tasks.`
              : `Complete all tasks due this month to receive your monthly payment on ${paymentDateFormatted}.`}
        </p>
        {tasksThisMonth > 0 && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {approvedThisMonth} of {tasksThisMonth} tasks approved this month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
