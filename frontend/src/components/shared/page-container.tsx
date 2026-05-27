import { cn } from "@lib/utils";

const MAX_WIDTH = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
} as const;

export type PageMaxWidth = keyof typeof MAX_WIDTH;

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: PageMaxWidth;
  /** Vertical spacing between page sections. Dashboards use `8`, lists use `6`. */
  spacing?: "6" | "8";
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = "6xl",
  spacing = "6",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "p-8 mx-auto",
        MAX_WIDTH[maxWidth],
        spacing === "8" ? "space-y-8" : "space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
