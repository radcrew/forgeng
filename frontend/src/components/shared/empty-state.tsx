import { Card, CardContent } from "@components/ui/card";
import { cn } from "@lib/utils";

interface EmptyStateProps {
  /** Simple centered message. Ignored when `children` is provided. */
  message?: string;
  children?: React.ReactNode;
  /** `default` = p-12 (lists). `compact` = p-8 (dashboard sections). */
  size?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  message,
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
          children && "flex flex-col items-center justify-center",
        )}
      >
        {children ?? message}
      </CardContent>
    </Card>
  );
}
