import { describe, expect, it } from "vitest";

import { validateSubmission } from "@features/submissions/validation";

describe("validateSubmission", () => {
  it("asks for a link or a write-up when both are blank", () => {
    expect(validateSubmission({ repoUrl: " ", content: "  " })).toEqual({
      content: "Add a repository link or a write-up.",
    });
  });

  it("rejects a link without https://", () => {
    expect(
      validateSubmission({ repoUrl: "github.com/you/repo", content: "" }),
    ).toHaveProperty("repoUrl");
  });

  it("rejects a write-up that is too long", () => {
    expect(
      validateSubmission({ repoUrl: "", content: "a".repeat(8001) }),
    ).toHaveProperty("content");
  });

  it("accepts a link on its own", () => {
    expect(
      validateSubmission({ repoUrl: "https://github.com/you/repo", content: "" }),
    ).toEqual({});
  });

  it("accepts a write-up on its own", () => {
    expect(validateSubmission({ repoUrl: "", content: "My notes" })).toEqual(
      {},
    );
  });
});
