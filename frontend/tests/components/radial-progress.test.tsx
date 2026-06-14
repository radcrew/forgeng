import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RadialProgress } from "@components/common/radial-progress";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function offsetOf(container: HTMLElement): number {
  // The second circle carries the progress dash offset. React renders the SVG
  // prop as the kebab-case DOM attribute `stroke-dashoffset`.
  const progress = container.querySelectorAll("circle")[1];
  return Number(progress.getAttribute("stroke-dashoffset"));
}

describe("RadialProgress", () => {
  it("renders the label text", () => {
    render(<RadialProgress percent={50} label="3/6" />);
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });

  it("uses a full dash offset at 0 percent", () => {
    const { container } = render(<RadialProgress percent={0} label="0/6" />);
    expect(offsetOf(container)).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it("uses no dash offset at 100 percent", () => {
    const { container } = render(<RadialProgress percent={100} label="6/6" />);
    expect(offsetOf(container)).toBeCloseTo(0, 5);
  });
});
