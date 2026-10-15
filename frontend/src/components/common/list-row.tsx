export type ListRowProps = {
  title: React.ReactNode;
  subtitle?: string;
  /** Optional control shown on the right, such as a remove button. */
  action?: React.ReactNode;
};

export const ListRow = ({ title, subtitle, action }: ListRowProps) => (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{title}</p>
      {subtitle ? (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
    {action}
  </div>
);
