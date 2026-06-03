"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, UserCircle } from "lucide-react";

import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";

export type StudentOnboardingProps = { name?: string | null };

export const StudentOnboarding = ({ name }: StudentOnboardingProps) => (
  <Card>
    <CardContent className="space-y-6 p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            Welcome to Forgeng{name ? `, ${name}` : ""}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Your account is ready, but you haven&apos;t been added to a cohort
            yet. Once an instructor enrolls you, your tasks, schedule, and
            progress will show up here.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">While you wait</p>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Complete your profile</p>
              <p className="text-xs text-muted-foreground">
                Add your bio and GitHub so instructors know who you are.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link
              href="/student/profile"
              className="flex items-center gap-1"
            >
              Profile <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
