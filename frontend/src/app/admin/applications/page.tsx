"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ListPageLayout } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import {
  ApplicationList,
  ApplicationStatusTabs,
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
      filterComponent={<ApplicationStatusTabs value={filter} onChange={setFilter} />}
      listComponent={({ items }) => (
        <ApplicationList
          applications={items}
          onSelect={(app) => router.push(`/admin/applications/${app.id}`)}
        />
      )}
      emptyMessage="No applications in this category."
      emptyArt={APP_ART.applications}
      loadingMessage="Loading applications…"
    />
  );
};

export default Page;
