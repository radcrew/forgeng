import type {
  Application,
  Cohort,
  Enrollment,
  Feedback,
  Submission,
  Task,
  UserProfile,
} from "@/lib/types";

const today = new Date();
const daysFromNow = (days: number) =>
  new Date(today.getTime() + days * 86_400_000).toISOString();

export const mockUsers: UserProfile[] = [
  {
    id: 1,
    name: "Avery Chen",
    email: "avery@example.com",
    role: "student",
    githubUrl: "https://github.com/averychen",
    createdAt: daysFromNow(-90),
  },
  {
    id: 2,
    name: "Jordan Reyes",
    email: "jordan@example.com",
    role: "student",
    githubUrl: null,
    createdAt: daysFromNow(-72),
  },
  {
    id: 3,
    name: "Sarah Patel",
    email: "sarah@example.com",
    role: "mentor",
    githubUrl: "https://github.com/sarahp",
    createdAt: daysFromNow(-200),
  },
  {
    id: 4,
    name: "James Okafor",
    email: "james@example.com",
    role: "mentor",
    githubUrl: null,
    createdAt: daysFromNow(-160),
  },
  {
    id: 5,
    name: "Riley Park",
    email: "riley@example.com",
    role: "admin",
    githubUrl: null,
    createdAt: daysFromNow(-300),
  },
  {
    id: 6,
    name: "Sam Diaz",
    email: "sam@example.com",
    role: "applicant",
    githubUrl: null,
    createdAt: daysFromNow(-5),
  },
];

export const mockCohorts: Cohort[] = [
  {
    id: 1,
    name: "Spring 2026 Cohort",
    description: "Full-stack engineering apprenticeship — 16 weeks.",
    capacity: 20,
    status: "active",
    startDate: daysFromNow(-30),
    endDate: daysFromNow(80),
    enrolledCount: 12,
  },
  {
    id: 2,
    name: "Summer 2026 Cohort",
    description: "Frontend specialization — React, accessibility, design systems.",
    capacity: 16,
    status: "draft",
    startDate: daysFromNow(45),
    endDate: daysFromNow(150),
    enrolledCount: 0,
  },
  {
    id: 3,
    name: "Fall 2025 Cohort",
    description: "Graduated batch — backend track.",
    capacity: 18,
    status: "completed",
    startDate: daysFromNow(-220),
    endDate: daysFromNow(-30),
    enrolledCount: 17,
  },
];

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Implement a Binary Search Tree",
    description: "Build a generic BST with insert, lookup, delete, and in-order traversal.",
    type: "coding",
    status: "published",
    cohortId: 1,
    dueDate: daysFromNow(3),
    submissionCount: 8,
  },
  {
    id: 2,
    title: "Read: Designing Data-Intensive Applications, Ch. 1",
    description: "Reliability, scalability, and maintainability. Write a one-page summary.",
    type: "reading",
    status: "published",
    cohortId: 1,
    dueDate: daysFromNow(7),
    submissionCount: 11,
  },
  {
    id: 3,
    title: "Project: Build a Realtime Chat App",
    description: "Two-week project using WebSockets, with persistence and basic auth.",
    type: "project",
    status: "published",
    cohortId: 1,
    dueDate: daysFromNow(14),
    submissionCount: 4,
  },
  {
    id: 4,
    title: "Quiz: HTTP, REST, and Idempotency",
    description: null,
    type: "quiz",
    status: "published",
    cohortId: 1,
    dueDate: null,
    submissionCount: 12,
  },
  {
    id: 5,
    title: "Refactor: Extract Pure Functions",
    description: "Take an existing endpoint and isolate the business logic from the IO.",
    type: "coding",
    status: "draft",
    cohortId: 2,
    dueDate: null,
    submissionCount: 0,
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: 101,
    taskId: 1,
    task: { id: 1, title: "Implement a Binary Search Tree", type: "coding" },
    user: { id: 1, name: "Avery Chen", email: "avery@example.com" },
    content: "Used recursion for insertion and an iterative approach for lookup. Tests cover all edge cases.",
    repoUrl: "https://github.com/averychen/bst-apprentice",
    status: "approved",
    feedbackCount: 1,
    createdAt: daysFromNow(-6),
  },
  {
    id: 102,
    taskId: 2,
    task: { id: 2, title: "Read: Designing Data-Intensive Applications, Ch. 1", type: "reading" },
    user: { id: 1, name: "Avery Chen", email: "avery@example.com" },
    content: "Summary attached. Most interesting takeaway: maintainability is about people, not just code.",
    repoUrl: null,
    status: "submitted",
    feedbackCount: 0,
    createdAt: daysFromNow(-2),
  },
  {
    id: 103,
    taskId: 1,
    task: { id: 1, title: "Implement a Binary Search Tree", type: "coding" },
    user: { id: 2, name: "Jordan Reyes", email: "jordan@example.com" },
    content: "First pass — would appreciate notes on the delete operation.",
    repoUrl: "https://github.com/jordanr/bst",
    status: "needs_work",
    feedbackCount: 1,
    createdAt: daysFromNow(-4),
  },
  {
    id: 104,
    taskId: 3,
    task: { id: 3, title: "Project: Build a Realtime Chat App", type: "project" },
    user: { id: 2, name: "Jordan Reyes", email: "jordan@example.com" },
    content: null,
    repoUrl: "https://github.com/jordanr/chat-mvp",
    status: "submitted",
    feedbackCount: 0,
    createdAt: daysFromNow(-1),
  },
];

export const mockFeedback: Feedback[] = [
  {
    id: 201,
    submissionId: 101,
    mentor: { id: 3, name: "Sarah Patel", email: "sarah@example.com" },
    verdict: "approved",
    content:
      "Great job handling the edge case in your sort function. Extracting the comparison logic into its own function would make this easier to unit-test. Really clean solution overall!",
    createdAt: daysFromNow(-5),
  },
  {
    id: 202,
    submissionId: 103,
    mentor: { id: 4, name: "James Okafor", email: "james@example.com" },
    verdict: "needs_work",
    content:
      "The core logic is right but error handling is missing. What happens on a 500? Add a try/catch and surface a user-friendly message.",
    createdAt: daysFromNow(-3),
  },
];

export const mockApplications: Application[] = [
  {
    id: 301,
    firstName: "Sam",
    lastName: "Diaz",
    email: "sam@example.com",
    background: "Self-taught for two years, currently a QA analyst looking to move into engineering.",
    experience: "JavaScript, Node, a bit of Python. Built a side project Slack bot.",
    motivation: "I want structured feedback, not another video course.",
    status: "pending",
    cohortId: null,
    reviewerNote: null,
    createdAt: daysFromNow(-2),
  },
  {
    id: 302,
    firstName: "Morgan",
    lastName: "Lee",
    email: "morgan@example.com",
    background: "Career switcher from finance. Completed CS50 and a bootcamp.",
    experience: "Python, SQL, basic React.",
    motivation: "I keep getting stuck on the gap between tutorials and real engineering.",
    status: "reviewing",
    cohortId: null,
    reviewerNote: "Strong written communication.",
    createdAt: daysFromNow(-4),
  },
  {
    id: 303,
    firstName: "Taylor",
    lastName: "Nguyen",
    email: "taylor@example.com",
    background: "CS undergrad, looking for project depth before graduation.",
    experience: "Java, TypeScript, several school group projects.",
    motivation: "Want mentorship before my first internship.",
    status: "accepted",
    cohortId: 1,
    reviewerNote: "Accepted into Spring 2026.",
    createdAt: daysFromNow(-9),
  },
  {
    id: 304,
    firstName: "Quinn",
    lastName: "Adler",
    email: "quinn@example.com",
    background: "Hobbyist for years.",
    experience: "HTML/CSS only.",
    motivation: "I want to be a hacker.",
    status: "rejected",
    cohortId: null,
    reviewerNote: "Not enough programming foundation yet — encouraged to reapply next cycle.",
    createdAt: daysFromNow(-14),
  },
];

export const mockEnrollments: Enrollment[] = [
  {
    id: 401,
    userId: 1,
    cohortId: 1,
    user: { id: 1, name: "Avery Chen", email: "avery@example.com" },
    enrolledAt: daysFromNow(-30),
  },
  {
    id: 402,
    userId: 2,
    cohortId: 1,
    user: { id: 2, name: "Jordan Reyes", email: "jordan@example.com" },
    enrolledAt: daysFromNow(-28),
  },
];

export interface StudentDashboard {
  cohort: Pick<Cohort, "id" | "name">;
  taskStats: { total: number; approved: number; pending: number; needsWork: number };
  nextDeadline: string | null;
  recentSubmissions: Submission[];
}

export interface MentorDashboard {
  pendingReviews: number;
  cohortBreakdown: { cohortId: number; cohortName: string; pendingCount: number }[];
  recentActivity: Submission[];
}

export interface AdminDashboard {
  applicationStats: {
    total: number;
    pending: number;
    reviewing: number;
    accepted: number;
    rejected: number;
  };
  activeCohorts: number;
  totalStudents: number;
  totalMentors: number;
  recentApplications: Application[];
}

export const mockStudentDashboard: StudentDashboard = {
  cohort: { id: 1, name: "Spring 2026 Cohort" },
  taskStats: { total: 8, approved: 3, pending: 4, needsWork: 1 },
  nextDeadline: daysFromNow(3),
  recentSubmissions: mockSubmissions.filter((s) => s.user?.id === 1).slice(0, 3),
};

export const mockMentorDashboard: MentorDashboard = {
  pendingReviews: mockSubmissions.filter((s) => s.status === "submitted").length,
  cohortBreakdown: [
    { cohortId: 1, cohortName: "Spring 2026 Cohort", pendingCount: 2 },
  ],
  recentActivity: mockSubmissions.slice(0, 3),
};

export const mockAdminDashboard: AdminDashboard = {
  applicationStats: {
    total: mockApplications.length,
    pending: mockApplications.filter((a) => a.status === "pending").length,
    reviewing: mockApplications.filter((a) => a.status === "reviewing").length,
    accepted: mockApplications.filter((a) => a.status === "accepted").length,
    rejected: mockApplications.filter((a) => a.status === "rejected").length,
  },
  activeCohorts: mockCohorts.filter((c) => c.status === "active").length,
  totalStudents: mockUsers.filter((u) => u.role === "student").length,
  totalMentors: mockUsers.filter((u) => u.role === "mentor").length,
  recentApplications: [...mockApplications]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 4),
};
