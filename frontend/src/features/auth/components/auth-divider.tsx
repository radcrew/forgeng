export const AuthDivider = ({ label = "or" }: { label?: string }) => (
  <div className="relative my-2">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-card text-muted-foreground px-2">{label}</span>
    </div>
  </div>
);
