"use client";

import { Wizard } from "@features/applications";
import { RoleGuard } from "@lib/auth";

const Page = () => (
  <RoleGuard allowedRoles={["applicant"]}>
    <Wizard />
  </RoleGuard>
);

export default Page;
