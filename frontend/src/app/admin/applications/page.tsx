"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  List,
  StatusTabs,
  type ApplicationStatusFilter,
  useApplications,
} from "@features/applications";

const Page = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");

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
        <List
          applications={applications}
          onSelect={(app) => router.push(`/admin/applications/${app.id}`)}
        />
      )}
    </PageContainer>
  );
};

export default Page;
