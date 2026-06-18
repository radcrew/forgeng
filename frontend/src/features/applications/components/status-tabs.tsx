import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { APPLICATION_STATUS_FILTER_TABS } from "@constants/applications";
import type { ApplicationStatusFilter } from "@types";

export type { ApplicationStatusFilter };

export type ApplicationStatusTabsProps = {
  value: ApplicationStatusFilter;
  onChange: (value: ApplicationStatusFilter) => void;
};

export const ApplicationStatusTabs = ({ value, onChange }: ApplicationStatusTabsProps) => (
  <Tabs
    value={value}
    onValueChange={(v) => onChange(v as ApplicationStatusFilter)}
  >
    <TabsList>
      {APPLICATION_STATUS_FILTER_TABS.map(({ value: tabValue, label }) => (
        <TabsTrigger key={tabValue} value={tabValue}>
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
