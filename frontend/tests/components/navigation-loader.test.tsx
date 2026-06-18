import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// usePathname drives the loader; mock it so we control the current route.
vi.mock("next/navigation", () => ({
  usePathname: () => "/student",
}));

import { NavigationLoader } from "@components/common/navigation-loader";

describe("NavigationLoader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing initially", () => {
    const { container } = render(<NavigationLoader />);
    expect(container).toBeEmptyDOMElement();
  });

  it("becomes visible when an internal link is clicked", async () => {
    render(
      <div>
        <NavigationLoader />
        <a href="/admin">Go to admin</a>
      </div>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Go to admin" }));

    // The loader overlay mounts (it contains the brand logo).
    expect(screen.getByRole("img", { name: /forge/i })).toBeInTheDocument();
  });

  it("ignores external links", async () => {
    const { container } = render(
      <div>
        <NavigationLoader />
        <a href="https://example.com">External</a>
      </div>,
    );

    await userEvent.click(screen.getByRole("link", { name: "External" }));

    // Still no overlay — the loader has no DOM beyond the sibling link.
    expect(container.querySelector(".fixed")).toBeNull();
  });

  it("ignores a link to the current path", async () => {
    // The component compares the target against window.location.pathname.
    window.history.replaceState({}, "", "/student");

    const { container } = render(
      <div>
        <NavigationLoader />
        <a href="/student">Same page</a>
      </div>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Same page" }));

    expect(container.querySelector(".fixed")).toBeNull();
  });
});
