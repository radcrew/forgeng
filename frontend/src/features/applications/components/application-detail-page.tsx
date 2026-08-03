"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { resolveAssetUrl } from "@lib/config";
import { useAsyncResource } from "@hooks/use-async-resource";
import { getApplication } from "../api";
import { ApplicationStatusBadge } from "./status-badge";
import { ApplicationContent } from "./application-content";
import { ApplicationReviewPanel } from "./application-review-panel";
import { ApplicationWalletsCard } from "./application-wallets-card";

export type ApplicationDetailPageProps = { id: number };

export const ApplicationDetailPage = ({ id }: ApplicationDetailPageProps) => {
  const { data: application, isLoading } = useAsyncResource(
    () => getApplication(id),
    [id],
  );

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Applications
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="u-display text-2xl">
            {application.firstName} {application.lastName}
          </h1>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {application.email} · Applied{" "}
          {format(new Date(application.createdAt), "MMM d, yyyy")}
        </p>
      </div>

      {application.videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Video Introduction</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={resolveAssetUrl(application.videoUrl)}
              controls
              playsInline
              className="w-full max-h-[480px] rounded-lg bg-black object-contain"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ApplicationContent application={application} />
        </div>

        <div className="space-y-4">
          <ApplicationReviewPanel
            applicationId={application.id}
            initialStatus={application.status}
            initialNote={application.reviewerNote ?? ""}
          />
          <ApplicationWalletsCard wallets={application.wallets ?? []} />
        </div>
      </div>
    </div>
  );
};
