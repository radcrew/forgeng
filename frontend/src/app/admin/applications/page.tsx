"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  List,
  StatusTabs,
  type ApplicationStatusFilter,
  useApplications,
} from "@features/applications";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const Page = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<ApplicationStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useApplications(filter, page, pageSize);

  const applications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFilterChange = (value: ApplicationStatusFilter) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <PageContainer maxWidth="5xl">
      <PageHeader
        title="Applications"
        description="Review and manage applicants through the pipeline."
      />

      <StatusTabs value={filter} onChange={handleFilterChange} />

      <p className="text-sm text-muted-foreground">
        {isLoading
          ? "Loading…"
          : `${total} ${total === 1 ? "application" : "applications"}`}
      </p>

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

      {total > 0 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Page;
