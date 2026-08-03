"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Pinned to light because the app is: no ThemeProvider is mounted, so
  // nothing ever puts `.dark` on <html>. This previously read `useTheme()`
  // from next-themes, which without a provider returns {} and fell back to
  // "system" — so on a dark-mode OS sonner styled itself dark while the
  // toast's own classes still resolved --background and --foreground to the
  // light values.
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
