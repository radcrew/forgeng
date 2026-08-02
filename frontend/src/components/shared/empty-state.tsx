import type { SpotIllustration } from "@components/illustrations";
import { Card, CardContent } from "@components/ui/card";
import { cn } from "@utils";

interface EmptyStateProps {
  /** Simple centered message. Ignored when `children` is provided. */
  message?: string;
  /** Spot art above the message, drawn from the product's own vocabulary. */
  illustration?: SpotIllustration;
  children?: React.ReactNode;
  /** `default` = p-12 (lists). `compact` = p-8 (dashboard sections). */
  size?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  message,
  illustration: Illustration,
  children,
  size = "default",
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("bg-muted/50 border-dashed", className)}>
      <CardContent
        className={cn(
          "text-center text-muted-foreground",
          size === "compact" ? "p-8" : "p-12",
          (children || Illustration) &&
            "flex flex-col items-center justify-center",
        )}
      >
        {Illustration && (
          <Illustration
            className={cn(size === "compact" ? "h-14 w-14 mb-3" : "h-20 w-20 mb-4")}
          />
        )}
        {children ?? message}
      </CardContent>
    </Card>
  );
}
