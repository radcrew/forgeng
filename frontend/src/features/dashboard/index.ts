export type { AdminDashboard, StudentDashboard } from "./types";
export { getAdminDashboard, getStudentDashboard } from "./api";
export { useAdminDashboard, useStudentDashboard } from "./hooks";

export { AdminView } from "./components/admin-view";
export type { AdminViewProps } from "./components/admin-view";
export { StudentView } from "./components/student-view";
export type { StudentViewProps } from "./components/student-view";
export { StudentOnboarding } from "./components/student-onboarding";
export type { StudentOnboardingProps } from "./components/student-onboarding";
export { StudentAnalytics } from "./components/student-analytics";
export type { StudentAnalyticsProps } from "./components/student-analytics";
