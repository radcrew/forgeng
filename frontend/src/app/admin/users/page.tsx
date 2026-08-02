"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { PAGE_SIZE_OPTIONS } from "@constants/shared/pagination";
import { UserRow, useUsers } from "@features/users";

const Page = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading } = useUsers("student", page, pageSize);

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Changing page size also resets to page 1 so the offset stays valid.
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Students"
        description="Manage students and their roles."
      />

      <p className="text-sm text-muted-foreground">
        {isLoading
          ? "Loading…"
          : `${total} ${total === 1 ? "student" : "students"}`}
      </p>

      {!isLoading && users.length === 0 ? (
        <EmptyState message="No students yet." art={APP_ART.cohort} />
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
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
