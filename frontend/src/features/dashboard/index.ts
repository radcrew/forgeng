export type { AdminDashboard, StudentDashboard } from "./types";
export { getAdminDashboard, getStudentDashboard } from "./api";
export { useAdminDashboard, useStudentDashboard } from "./hooks";

export { AdminView } from "./components/admin-view";
export type { AdminViewProps } from "./components/admin-view";
export { StudentView } from "./components/student-view";
export type { StudentViewProps } from "./components/student-view";
