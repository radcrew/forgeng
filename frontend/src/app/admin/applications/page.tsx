"use client";

import { useState } from "react";

import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  DetailDialog,
  List,
  StatusTabs,
  type Application,
  type ApplicationStatusFilter,
  useApplications,
} from "@features/applications";

const Page = () => {
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useApplications(filter);

  return (
    <PageContainer maxWidth="5xl">
      <PageHeader
        title="Applications"
        description="Review and manage applicants through the pipeline."
      />

      <StatusTabs value={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingState message="Loading applications…" />
      ) : applications.length === 0 ? (
        <EmptyState message="No applications in this category." />
      ) : (
        <List applications={applications} onSelect={setSelected} />
      )}

      {selected && (
        <DetailDialog
          application={selected}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default Page;
