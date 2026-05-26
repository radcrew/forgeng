import Link from "next/link";

import { Button } from "@components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <p className="text-sm font-semibold tracking-widest text-primary">
          404
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          We can&apos;t find that page.
        </h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for moved, was deleted, or never existed.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
