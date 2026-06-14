import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MonthlyPayment } from "@types";
import { PaymentProgress } from "@features/dashboard/components/payment-progress";

function make(overrides: Partial<MonthlyPayment> = {}): MonthlyPayment {
  return {
    tasksThisMonth: 4,
    approvedThisMonth: 1,
    paymentDate: "2026-02-28T23:59:59.999Z",
    eligible: false,
    ...overrides,
  } as MonthlyPayment;
}

describe("PaymentProgress", () => {
  it("shows the no-tasks message when none are due", () => {
    render(<PaymentProgress monthlyPayment={make({ tasksThisMonth: 0, approvedThisMonth: 0 })} />);
    expect(screen.getByText("No tasks due this month")).toBeInTheDocument();
    // Radial label is an em dash when there are no tasks.
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("congratulates an eligible student", () => {
    render(
      <PaymentProgress
        monthlyPayment={make({ tasksThisMonth: 4, approvedThisMonth: 4, eligible: true })}
      />,
    );
    expect(
      screen.getByText("You've earned this month's stipend!"),
    ).toBeInTheDocument();
    expect(screen.getByText("Eligible")).toBeInTheDocument();
  });

  it("prompts to complete all tasks when none are approved yet", () => {
    render(
      <PaymentProgress
        monthlyPayment={make({ tasksThisMonth: 4, approvedThisMonth: 0 })}
      />,
    );
    expect(
      screen.getByText("Complete your 4 tasks to earn this month's stipend"),
    ).toBeInTheDocument();
  });

  it("counts the remaining tasks with singular wording for one left", () => {
    render(
      <PaymentProgress
        monthlyPayment={make({ tasksThisMonth: 4, approvedThisMonth: 3 })}
      />,
    );
    expect(
      screen.getByText("1 task left to unlock your monthly stipend"),
    ).toBeInTheDocument();
  });

  it("renders the percent-complete line from approved/total", () => {
    render(
      <PaymentProgress
        monthlyPayment={make({ tasksThisMonth: 4, approvedThisMonth: 1 })}
      />,
    );
    // 1/4 = 25%
    expect(screen.getByText("25% complete")).toBeInTheDocument();
    expect(screen.getByText("1/4")).toBeInTheDocument();
  });
});
