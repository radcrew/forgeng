import { cn } from "@utils/cn";

export const DetailGrid = ({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 1 | 2;
}) => (
  <div
    className={cn(
      "gap-4 text-sm",
      columns === 2 ? "grid grid-cols-2" : "space-y-3",
    )}
  >
    {children}
  </div>
);

export const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="min-w-0">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value}</p>
  </div>
);

export const SectionTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={cn("text-sm font-semibold mb-2", className)}>{children}</h3>
);

export const ProseBlock = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p
    className={cn(
      "text-sm text-muted-foreground whitespace-pre-wrap break-words bg-muted/50 rounded-lg p-3",
      className,
    )}
  >
    {children}
  </p>
);
