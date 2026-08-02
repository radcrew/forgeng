import { cn } from "@utils";

/**
 * Two widths, named for what the page holds rather than for a Tailwind step.
 * `wide` matches the marketing container so the product does not visibly
 * narrow when you sign in; `reading` exists only where line length matters.
 */
const MAX_WIDTH = {
  wide: "max-w-[88rem]",
  reading: "max-w-3xl",
} as const;

export type PageMaxWidth = keyof typeof MAX_WIDTH;

interface PageContainerProps {
  children: React.ReactNode;
  /** Defaults to `wide`. Use `reading` for forms and long prose only. */
  maxWidth?: PageMaxWidth;
  /** Vertical spacing between page sections. Dashboards use `8`, lists use `6`. */
  spacing?: "6" | "8";
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = "wide",
  spacing = "6",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-8 py-10 lg:px-12",
        MAX_WIDTH[maxWidth],
        spacing === "8" ? "space-y-8" : "space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
