import { Illustration } from "@components/illustrations";
import { Card, CardContent } from "@components/ui/card";
import type { Illustration as IllustrationAsset } from "@constants/shared/illustration";
import { cn } from "@utils";

interface EmptyStateProps {
  /** Simple centered message. Ignored when `children` is provided. */
  message?: string;
  /** Spot illustration above the message. */
  art?: IllustrationAsset;
  children?: React.ReactNode;
  /** `default` = p-12 (lists). `compact` = p-8 (dashboard sections). */
  size?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  message,
  art,
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
          (children || art) && "flex flex-col items-center justify-center",
        )}
      >
        {art && (
          <Illustration
            art={art}
            className={cn(
              size === "compact" ? "h-24 mb-4" : "h-36 mb-6",
              "w-auto max-w-[220px]",
            )}
          />
        )}
        {children ?? message}
      </CardContent>
    </Card>
  );
}
