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
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { USER_ROLE_FILTER_TABS } from "@constants/users";
import { PAGE_SIZE_OPTIONS } from "@constants/shared/pagination";
import { Row, useUsers, type UserRoleFilter } from "@features/users";

const Page = () => {
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading } = useUsers(roleFilter, page, pageSize);

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Switching filters resets to the first page so we never land past the end.
  const handleRoleChange = (value: UserRoleFilter) => {
    setRoleFilter(value);
    setPage(1);
  };

  // Changing page size also resets to page 1 so the offset stays valid.
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Users"
        description="Manage platform users and their roles."
      />

      <Tabs
        value={roleFilter}
        onValueChange={(v) => handleRoleChange(v as UserRoleFilter)}
      >
        <TabsList>
          {USER_ROLE_FILTER_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        {isLoading ? "Loading…" : `${total} ${total === 1 ? "user" : "users"}`}
      </p>

      {!isLoading && users.length === 0 ? (
        <EmptyState message="No users match this filter." />
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <Row key={user.id} user={user} />
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
