import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Apply to Forgeng's mentor-led software engineering apprenticeship. Free to apply, no CS degree required, monthly stipend included.",
};

const ApplyLayout = ({ children }: { children: ReactNode }) => children;

export default ApplyLayout;
