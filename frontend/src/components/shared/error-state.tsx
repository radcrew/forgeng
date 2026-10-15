import { Button } from "@components/ui/button";

import { EmptyState } from "./empty-state";

interface ErrorStateProps {
  /** What failed to load, for example "your tasks". */
  what?: string;
  /** Loads the data again. */
  onRetry?: () => void;
  size?: "default" | "compact";
}

/** Shown when data failed to load, so a failure never looks like "no data". */
export function ErrorState({
  what = "this page",
  onRetry,
  size = "default",
}: ErrorStateProps) {
  return (
    <EmptyState size={size}>
      <p role="alert">
        We couldn&apos;t load {what}. Check your connection and try again.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </EmptyState>
  );
}
