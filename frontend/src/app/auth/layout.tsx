import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const AuthFlowLayout = ({ children }: { children: ReactNode }) => children;

export default AuthFlowLayout;
