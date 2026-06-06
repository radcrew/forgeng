"use client";

import type { ReactNode } from "react";

import { Wizard } from "@features/applications";
import { RoleGuard } from "@lib/auth";

const ApplyStepLayout = ({ children }: { children: ReactNode }) => (
  <RoleGuard allowedRoles={["applicant"]}>
    <Wizard>{children}</Wizard>
  </RoleGuard>
);

export default ApplyStepLayout;
