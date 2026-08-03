const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  // `main` so these screens expose a landmark. They had none, which left
  // screen-reader users no way to jump past the chrome to the form.
  <main className="min-h-screen bg-background flex items-center justify-center p-4">
    {children}
  </main>
);

export default AuthLayout;
