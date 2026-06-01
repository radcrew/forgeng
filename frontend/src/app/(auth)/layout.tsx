const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    {children}
  </div>
);

export default AuthLayout;
