import Link from "next/link";

import { Illustration } from "@components/illustrations";
import { Button } from "@components/ui/button";
import { APP_ART } from "@constants/shared/app-illustrations";

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="text-center max-w-lg space-y-4">
      <Illustration art={APP_ART.pageNotFound} className="mx-auto h-48 w-auto" />
      <p className="u-tech text-[0.75rem] text-primary-strong">Error 404</p>
      <h1 className="u-display u-tight text-4xl">
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

export default NotFound;
