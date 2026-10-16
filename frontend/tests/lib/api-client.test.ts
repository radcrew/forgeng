import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redirectToSignInIfNeeded } from "@lib/api-client";

const assign = vi.fn();
const originalLocation = window.location;

const visit = (pathname: string) => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, assign },
  });
};

beforeEach(() => {
  assign.mockReset();
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("redirectToSignInIfNeeded", () => {
  it.each(["/student", "/student/tasks", "/admin/users/3", "/apply/video"])(
    "sends the user to sign in from %s",
    (pathname) => {
      visit(pathname);
      redirectToSignInIfNeeded();
      expect(assign).toHaveBeenCalledWith("/sign-in");
    },
  );

  it.each(["/", "/sign-in", "/privacy", "/students-guide"])(
    "leaves public page %s alone",
    (pathname) => {
      visit(pathname);
      redirectToSignInIfNeeded();
      expect(assign).not.toHaveBeenCalled();
    },
  );
});
