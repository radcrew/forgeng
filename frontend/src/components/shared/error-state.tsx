import { Button } from "@components/ui/button";

import { EmptyState } from "./empty-state";

interface ErrorStateProps {
  /** What failed to load, for example "your tasks". */
  what?: string;
  /** Loads the data again. */
  onRetry?: () => void;
  size?: "default" | "compact";
  /** Replaces the default sentence, for example when older data still shows. */
  message?: string;
}

/** Shown when data failed to load, so a failure never looks like "no data". */
export function ErrorState({
  what = "this page",
  onRetry,
  size = "default",
  message,
}: ErrorStateProps) {
  return (
    <EmptyState size={size}>
      <p role="alert">
        {message ??
          `We couldn't load ${what}. Check your connection and try again.`}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </EmptyState>
  );
}
