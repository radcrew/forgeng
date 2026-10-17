"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { PAGE_SIZE_OPTIONS } from "@constants/shared/pagination";
import { USER_ROLE_FILTER_TABS } from "@constants/users";
import { UserRow, useUsers, type UserRoleFilter } from "@features/users";

const SEARCH_DELAY_MS = 300;

// Wording for the count and the empty message on each tab.
const ROLE_NOUNS: Record<UserRoleFilter, [string, string]> = {
  all: ["user", "users"],
  applicant: ["applicant", "applicants"],
  student: ["student", "students"],
  admin: ["admin", "admins"],
};

const Page = () => {
  // Students stay the first view, as before; the other tabs are one click away.
  const [role, setRole] = useState<UserRoleFilter>("student");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // What the admin types, and the search actually sent. The second one waits
  // until typing pauses, so each key press doesn't send a request.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const { data, isLoading } = useUsers(role, page, pageSize, search);
  const [singular, plural] = ROLE_NOUNS[role];

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      // New results start at page 1.
      setPage(1);
    }, SEARCH_DELAY_MS);
  };

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Changing page size also resets to page 1 so the offset stays valid.
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage applicants, students, and admins."
      />

      <Tabs
        value={role}
        onValueChange={(v) => {
          setRole(v as UserRoleFilter);
          // A new tab starts at page 1 so a shorter list isn't hidden.
          setPage(1);
        }}
      >
        <TabsList>
          {USER_ROLE_FILTER_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search users by name or email"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {isLoading ? "Loading…" : `${total} ${total === 1 ? singular : plural}`}
      </p>

      {!isLoading && users.length === 0 ? (
        <EmptyState
          message={
            search.trim()
              ? `No ${plural} match "${search.trim()}".`
              : `No ${plural} yet.`
          }
          art={search.trim() ? APP_ART.noResults : APP_ART.cohort}
        />
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
