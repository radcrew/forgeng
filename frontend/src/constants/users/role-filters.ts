import type { UserRole, UserRoleFilter } from "@types";

import type { LabeledValue } from "../shared/labeled-value";

export const USER_ROLE_FILTER_TABS: LabeledValue<UserRoleFilter>[] = [
  { value: "all", label: "All" },
  { value: "applicant", label: "Applicants" },
  { value: "student", label: "Students" },
  { value: "admin", label: "Admins" },
];

export const USER_ROLE_OPTIONS: LabeledValue<UserRole>[] = [
  { value: "applicant", label: "Applicant" },
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
];
