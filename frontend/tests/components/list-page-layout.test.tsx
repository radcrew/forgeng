import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListPageLayout } from "@components/shared/list-page-layout";

type Item = { id: number };

// 45 items in every filter, 20 per page: three pages.
const useData = vi.fn((_filter: string, page: number, pageSize: number) => ({
  data: { items: [{ id: page }], total: 45, page, pageSize },
  isLoading: false,
}));

const List = ({ items }: { items: Item[] }) => (
  <ul>
    {items.map((i) => (
      <li key={i.id}>item {i.id}</li>
    ))}
  </ul>
);

const renderLayout = (filter: string) => (
  <ListPageLayout<Item>
    header={{ title: "Applications", description: "All of them" }}
    useData={useData}
    filter={filter}
    listComponent={List}
  />
);

describe("ListPageLayout", () => {
  it("goes back to page 1 when the filter changes", async () => {
    const { rerender } = render(renderLayout("all"));

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();

    rerender(renderLayout("rejected"));

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(useData).toHaveBeenLastCalledWith("rejected", 1, 20);
  });
});
