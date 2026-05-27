"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { PageContainer, PageHeader } from "@components/shared";
import {
  AdminUserRow,
  useUsers,
  type UserRoleFilter,
} from "@features/users";

const AdminUsersPage = () => {
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const { data: users = [], isLoading } = useUsers(roleFilter);

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title="Users"
        description="Manage platform users and their roles."
      />

      <Tabs
        value={roleFilter}
        onValueChange={(v) => setRoleFilter(v as UserRoleFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="applicant">Applicants</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="mentor">Mentors</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-sm text-muted-foreground">
        {isLoading ? "Loading…" : `${users.length} users`}
      </p>

      <div className="space-y-2">
        {users.map((user) => (
          <AdminUserRow key={user.id} user={user} />
        ))}
      </div>
    </PageContainer>
  );
};

export default AdminUsersPage;
