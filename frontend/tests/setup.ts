import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount React trees between tests so the jsdom document stays isolated.
afterEach(() => {
  cleanup();
});
