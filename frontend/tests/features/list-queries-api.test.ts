import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { listUsers } from "@features/users/api";
import { listSubmissions } from "@features/submissions/api";
import { listTasks } from "@features/tasks/api";

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue([]);
});

describe("listUsers", () => {
  it("requests the bare path with no params", async () => {
    await listUsers();
    expect(get).toHaveBeenCalledWith("/users");
  });

  it("assembles role and pagination params", async () => {
    await listUsers({ role: "student", page: 2, pageSize: 10 });
    expect(get).toHaveBeenCalledWith("/users?role=student&page=2&pageSize=10");
  });
});

describe("listSubmissions", () => {
  it("requests the bare path with no options", async () => {
    await listSubmissions();
    expect(get).toHaveBeenCalledWith("/submissions");
  });

  it("assembles status, taskId, and cohortId params", async () => {
    await listSubmissions({ status: "submitted", taskId: 5, cohortId: 3 });
    expect(get).toHaveBeenCalledWith(
      "/submissions?status=submitted&taskId=5&cohortId=3",
    );
  });
});

describe("listTasks", () => {
  it("requests the bare path when no cohort is given", async () => {
    await listTasks();
    expect(get).toHaveBeenCalledWith("/tasks");
  });

  it("appends the cohortId query when provided", async () => {
    await listTasks(3);
    expect(get).toHaveBeenCalledWith("/tasks?cohortId=3");
  });
});
