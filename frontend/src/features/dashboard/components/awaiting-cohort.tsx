import Link from "next/link";

import { Illustration } from "@components/illustrations";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { APP_ART } from "@constants/shared/app-illustrations";

export interface AwaitingCohortProps {
  /** When true, the profile still needs filling in before enrollment. */
  profileIncomplete?: boolean;
}

/**
 * Stands in for the dashboard before a student is enrolled. This is the first
 * screen most accepted applicants see, so it explains what happens next rather
 * than leaving an empty page.
 */
export function AwaitingCohort({ profileIncomplete }: AwaitingCohortProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
        <Illustration art={APP_ART.onboarding} className="h-44 w-auto max-w-sm" />

        {profileIncomplete ? (
          <>
            <h2 className="u-display text-xl">
              Finish your profile to get placed.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Complete every profile field so we can match you to a cohort and
              start sending you tasks.
            </p>
            <Button asChild size="sm">
              <Link href="/student/profile">Complete Your Profile</Link>
            </Button>
          </>
        ) : (
          <>
            <h2 className="u-display text-xl">
              You&apos;re in. Your cohort is next.
            </h2>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Your account is ready, but you haven&apos;t been added to a cohort
              yet. Once an instructor enrolls you, your tasks, schedule, and
              progress will show up here.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
