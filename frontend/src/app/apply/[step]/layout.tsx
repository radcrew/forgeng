"use client";

import type { ReactNode } from "react";

import { Wizard } from "@features/applications";

const ApplyStepLayout = ({ children }: { children: ReactNode }) => (
  <Wizard>{children}</Wizard>
);

export default ApplyStepLayout;
