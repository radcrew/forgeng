import { cn } from "@lib/utils";

export type LoadingStateProps = {
  message?: string;
  className?: string;
};

export const LoadingState = ({
  message = "Loading…",
  className,
}: LoadingStateProps) => (
  <p
    className={cn(
      "text-sm text-muted-foreground py-8 text-center",
      className,
    )}
  >
    {message}
  </p>
);
