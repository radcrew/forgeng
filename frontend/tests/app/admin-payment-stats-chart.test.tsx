import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PaymentStatsChart } from "../../src/app/admin/users/[id]/_components/payment-stats-chart";

describe("PaymentStatsChart", () => {
  it("shows every payment for a month, each with its own link", () => {
    render(
      <PaymentStatsChart
        stats={[
          {
            month: "2026-05",
            tasksTotal: 2,
            tasksApproved: 2,
            eligible: true,
            notifiedAt: null,
            payments: [
              {
                amount: "30",
                currency: "USDT",
                txLink: "https://example.com/tx/1",
                paidAt: "2026-06-02T10:00:00.000Z",
              },
              {
                amount: "20",
                currency: "USD",
                txLink: null,
                paidAt: "2026-06-09T10:00:00.000Z",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText("30 USDT paid")).toBeInTheDocument();
    expect(screen.getByText("20 USD paid")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "View transaction" }),
    ).toHaveLength(1);
  });

  it("shows no payment line for a month without payments", () => {
    render(
      <PaymentStatsChart
        stats={[
          {
            month: "2026-04",
            tasksTotal: 0,
            tasksApproved: 0,
            eligible: false,
            notifiedAt: null,
            payments: [],
          },
        ]}
      />,
    );

    expect(screen.queryByText(/paid/)).not.toBeInTheDocument();
  });
});
