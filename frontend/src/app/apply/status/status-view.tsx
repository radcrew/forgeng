"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@components/brand/logo";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { useCurrentUser } from "@contexts";
import { getMyApplication, ApplicationStatusBadge } from "@features/applications";
import { useAsyncResource } from "@hooks/use-async-resource";
import type { ApplicationStatus } from "@types";

const STATUS_COPY: Record<ApplicationStatus, { title: string; body: string }> =
  {
    pending: {
      title: "Application received",
      body: "Thanks for applying! Your application is in the queue. We review every application personally and aim to get back to you within a week.",
    },
    accepted: {
      title: "You're in! 🎉",
      body: "Congratulations — you've been accepted. Sign in again to access your student portal and get started.",
    },
    rejected: {
      title: "Application decision",
      body: "Thank you for your interest in Forgeng. We're unable to offer you a place this time, but we'd welcome a future application.",
    },
  };

export const ApplicationStatusView = () => {
  const router = useRouter();
  const { refreshUser } = useCurrentUser();
  const { data, isLoading } = useAsyncResource(() => getMyApplication(), []);

  const goToPortal = async () => {
    // Acceptance promotes the account to `student` server-side; sync the local
    // session so the student route guard lets them through.
    await refreshUser();
    router.push("/student");
  };

  useEffect(() => {
    // No application on record — send them to the apply form.
    if (!isLoading && data === null) router.replace("/apply");
  }, [isLoading, data, router]);

  if (isLoading || data == null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
        </Card>
      </div>
    );
  }

  const copy = STATUS_COPY[data.status];
  const submitted = new Date(data.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <Logo size={28} priority />
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-2xl">{copy.title}</CardTitle>
              <ApplicationStatusBadge status={data.status} />
            </div>
            <CardDescription>{copy.body}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Submitted on {submitted}
          </p>
          {data.status === "accepted" ? (
            <Button className="w-full" onClick={goToPortal}>
              Go to your portal
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to home</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
