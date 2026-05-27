"use client";

import { useMemo, useState } from "react";

import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { mockApplications } from "@lib/mock-data";
import type { Application } from "@lib/types";

import { ApplicationDetailDialog } from "./_components/application-detail-dialog";
import { ApplicationStatusTabs } from "./_components/application-status-tabs";
import type { ApplicationStatusFilter } from "./_components/application-status-tabs";
import { ApplicationsList } from "./_components/applications-list";

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const applications = useMemo(() => {
    if (filter === "all") return mockApplications;
    return mockApplications.filter((a) => a.status === filter);
  }, [filter]);

  return (
    <PageContainer maxWidth="5xl">
      <PageHeader
        title="Applications"
        description="Review and manage applicants through the pipeline."
      />

      <ApplicationStatusTabs value={filter} onChange={setFilter} />

      {applications.length === 0 ? (
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
}
