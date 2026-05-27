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

export { AdminView } from "./components/admin-view";
export type { AdminViewProps } from "./components/admin-view";
export { StudentView } from "./components/student-view";
export type { StudentViewProps } from "./components/student-view";
export { MentorView } from "./components/mentor-view";
export type { MentorViewProps } from "./components/mentor-view";
