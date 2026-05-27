export type {
  AdminDashboard,
  MentorDashboard,
  StudentDashboard,
} from "./types";
export {
  getAdminDashboard,
  getMentorDashboard,
  getStudentDashboard,
} from "./api";
export {
  useAdminDashboard,
  useMentorDashboard,
  useStudentDashboard,
} from "./hooks";

export { AdminDashboardView } from "./components/admin-dashboard-view";
export type { AdminDashboardViewProps } from "./components/admin-dashboard-view";
export { StudentDashboardView } from "./components/student-dashboard-view";
export type { StudentDashboardViewProps } from "./components/student-dashboard-view";
export { MentorDashboardView } from "./components/mentor-dashboard-view";
export type { MentorDashboardViewProps } from "./components/mentor-dashboard-view";
