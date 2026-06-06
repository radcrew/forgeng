export type ListRowProps = {
  title: React.ReactNode;
  subtitle?: string;
};

export const ListRow = ({ title, subtitle }: ListRowProps) => (
  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
    <div>
      <p className="text-sm font-medium">{title}</p>
      {subtitle ? (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  </div>
);
