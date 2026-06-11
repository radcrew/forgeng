"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ListPageLayout } from "@components/shared";
import {
  List,
  StatusTabs,
  type Application,
  type ApplicationStatusFilter,
  useApplications,
} from "@features/applications";

const Page = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");

  return (
    <ListPageLayout<Application, ApplicationStatusFilter>
      header={{
        title: "Applications",
        description: "Review and manage applicants through the pipeline.",
      }}
      useData={useApplications}
      filter={filter}
      filterComponent={<StatusTabs value={filter} onChange={setFilter} />}
      listComponent={({ items }) => (
        <List
          applications={items}
          onSelect={(app) => router.push(`/admin/applications/${app.id}`)}
        />
      )}
      emptyMessage="No applications in this category."
      loadingMessage="Loading applications…"
    />
  );
};

export default Page;
