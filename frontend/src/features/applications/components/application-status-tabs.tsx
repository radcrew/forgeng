import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";

import type { ApplicationStatus } from "../types";

export type ApplicationStatusFilter = ApplicationStatus | "all";

interface ApplicationStatusTabsProps {
  value: ApplicationStatusFilter;
  onChange: (value: ApplicationStatusFilter) => void;
}

export function ApplicationStatusTabs({
  value,
  onChange,
}: ApplicationStatusTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as ApplicationStatusFilter)}
    >
      <TabsList>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
        <TabsTrigger value="accepted">Accepted</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
