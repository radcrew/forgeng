import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setSelectedCohortId = vi.fn();
vi.mock("@contexts", () => ({
  useSelectedCohort: () => ({ setSelectedCohortId }),
}));

import { CohortSwitcher } from "@features/dashboard/components/cohort-switcher";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CohortSwitcher", () => {
  it("renders nothing for a single cohort", () => {
    const { container } = render(
      <CohortSwitcher cohorts={[{ id: 1, name: "Solo" }]} activeCohortId={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for no cohorts", () => {
    const { container } = render(
      <CohortSwitcher cohorts={[]} activeCohortId={0} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a switcher when enrolled in multiple cohorts", () => {
    render(
      <CohortSwitcher
        cohorts={[
          { id: 1, name: "Spring" },
          { id: 2, name: "Summer" },
        ]}
        activeCohortId={1}
      />,
    );
    expect(
      screen.getByRole("combobox", { name: "Switch cohort" }),
    ).toBeInTheDocument();
  });
});
