import { CheckSquare, ClipboardList, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import type { Cohort } from "../types";

export type CohortDetailStatsProps = {
  cohort: Cohort;
  totalTaskCount: number;
  publishedTaskCount: number;
  submissionCount: number;
  pendingReviews: number;
};

export const CohortDetailStats = ({
  cohort,
  totalTaskCount,
  publishedTaskCount,
  submissionCount,
  pendingReviews,
}: CohortDetailStatsProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard
      icon={<Users className="h-4 w-4" />}
      label="Students"
      value={`${cohort.enrolledCount} / ${cohort.capacity}`}
    />
    <StatCard
      icon={<CheckSquare className="h-4 w-4" />}
      label="Tasks"
      value={`${publishedTaskCount} published`}
      hint={`${totalTaskCount} total`}
    />
    <StatCard
      icon={<ClipboardList className="h-4 w-4" />}
      label="Submissions"
      value={`${submissionCount}`}
    />
    <StatCard
      icon={<ClipboardList className="h-4 w-4" />}
      label="Pending Reviews"
      value={`${pendingReviews}`}
    />
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);
