import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const patch = vi.fn();
vi.mock("@lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
    post: vi.fn(),
    postForm: vi.fn(),
  },
}));

import {
  listApplications,
  updateApplicationStatus,
} from "@features/applications/api";

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  patch.mockResolvedValue({});
});

describe("listApplications", () => {
  it("requests the bare path when no params are given", async () => {
    await listApplications();
    expect(get).toHaveBeenCalledWith("/applications");
  });

  it("assembles a query string from the provided params", async () => {
    await listApplications({ status: "pending", page: 2, pageSize: 10 });
    expect(get).toHaveBeenCalledWith(
      "/applications?status=pending&page=2&pageSize=10",
    );
  });

  it("omits unset params", async () => {
    await listApplications({ page: 3 });
    expect(get).toHaveBeenCalledWith("/applications?page=3");
  });
});

describe("updateApplicationStatus", () => {
  it("sends only the status when no extras are provided", async () => {
    await updateApplicationStatus(5, { status: "accepted" });
    expect(patch).toHaveBeenCalledWith("/applications/5/status", {
      status: "accepted",
    });
  });

  it("includes reviewerNote when explicitly provided (even null)", async () => {
    await updateApplicationStatus(5, { status: "rejected", reviewerNote: null });
    expect(patch).toHaveBeenCalledWith("/applications/5/status", {
      status: "rejected",
      reviewerNote: null,
    });
  });

  it("includes cohortId only when non-null", async () => {
    await updateApplicationStatus(5, { status: "accepted", cohortId: 3 });
    expect(patch).toHaveBeenCalledWith("/applications/5/status", {
      status: "accepted",
      cohortId: 3,
    });
  });
});
