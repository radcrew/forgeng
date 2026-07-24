import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Pin the API origin so tests don't depend on .env.local (absent in CI, where
// API_URL would otherwise fall back to the production default).
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";

// Unmount React trees between tests so the jsdom document stays isolated.
afterEach(() => {
  cleanup();
});
