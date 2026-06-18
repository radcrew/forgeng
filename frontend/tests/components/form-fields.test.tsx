import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FormBody,
  FormField,
  FormGrid,
} from "@components/common/form-fields";

describe("form-fields", () => {
  it("FormField associates its label with the control via htmlFor", () => {
    render(
      <FormField label="Name" htmlFor="name">
        <input id="name" />
      </FormField>,
    );
    // getByLabelText only resolves when the label is wired to the input.
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("FormBody renders its children", () => {
    render(
      <FormBody>
        <span>field</span>
      </FormBody>,
    );
    expect(screen.getByText("field")).toBeInTheDocument();
  });

  it("FormGrid renders its children", () => {
    render(
      <FormGrid>
        <span>left</span>
        <span>right</span>
      </FormGrid>,
    );
    expect(screen.getByText("left")).toBeInTheDocument();
    expect(screen.getByText("right")).toBeInTheDocument();
  });
});
