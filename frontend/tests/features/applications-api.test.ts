import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const patch = vi.fn();
const post = vi.fn();
const postForm = vi.fn();
vi.mock("@lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
    post: (...args: unknown[]) => post(...args),
    postForm: (...args: unknown[]) => postForm(...args),
  },
}));

import {
  listApplications,
  updateApplicationStatus,
  uploadVideoIntro,
} from "@features/applications/api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  patch.mockResolvedValue({});
  vi.stubGlobal("fetch", fetchMock);
});

describe("uploadVideoIntro", () => {
  const blob = new Blob(["v"], { type: "video/webm;codecs=vp9,opus" });

  it("uploads straight to the signed URL and returns the storage path", async () => {
    post.mockResolvedValue({ uploadUrl: "https://signed/up", path: "7/a.webm" });
    fetchMock.mockResolvedValue({ ok: true });

    await expect(uploadVideoIntro(blob)).resolves.toEqual({ url: "7/a.webm" });
    expect(post).toHaveBeenCalledWith("/applications/video-intro/upload-url", {
      contentType: "video/webm",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://signed/up", {
      method: "PUT",
      headers: { "Content-Type": "video/webm" },
      body: blob,
    });
    expect(postForm).not.toHaveBeenCalled();
  });

  it("throws when storage rejects the upload", async () => {
    post.mockResolvedValue({ uploadUrl: "https://signed/up", path: "7/a.webm" });
    fetchMock.mockResolvedValue({ ok: false, status: 413 });

    await expect(uploadVideoIntro(blob)).rejects.toThrow("413");
  });

  it("posts the file to the API when no signed URL is offered", async () => {
    post.mockResolvedValue({ uploadUrl: null, path: null });
    postForm.mockResolvedValue({ url: "/api/uploads/videos/7-a.webm" });

    await expect(uploadVideoIntro(blob)).resolves.toEqual({
      url: "/api/uploads/videos/7-a.webm",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
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
