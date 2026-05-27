"use client";

import { useState } from "react";

import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  ApplicationDetailDialog,
  ApplicationStatusTabs,
  ApplicationsList,
  useApplications,
  type Application,
  type ApplicationStatusFilter,
} from "@features/applications";

const AdminApplicationsPage = () => {
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const { data: applications = [], isLoading } = useApplications(filter);

  return (
    <PageContainer maxWidth="5xl">
      <PageHeader
        title="Applications"
        description="Review and manage applicants through the pipeline."
      />

      <ApplicationStatusTabs value={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingState message="Loading applications…" />
      ) : applications.length === 0 ? (
        <EmptyState message="No applications in this category." />
      ) : (
        <ApplicationsList applications={applications} onSelect={setSelected} />
      )}

      {selected && (
        <ApplicationDetailDialog
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

export default AdminApplicationsPage;
