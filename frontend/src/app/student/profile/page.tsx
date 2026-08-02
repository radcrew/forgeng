"use client";

import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { LoadingState } from "@components/common";
import { Badge } from "@components/ui/badge";
import { Card } from "@components/ui/card";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import { APP_ART } from "@constants/shared/app-illustrations";
import { useCurrentUser } from "@contexts";
import { ProfileForm, WalletManager, useEnrollments } from "@features/profile";

const Page = () => {
  const { user, isHydrated, refreshUser } = useCurrentUser();
  const { data: enrollments = [], isLoading } = useEnrollments();

  if (!isHydrated || !user) {
    return (
      <PageContainer maxWidth="4xl" spacing="8">
        <PageHeader title="Profile" description="Loading…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="4xl" spacing="8">
      <PageHeader title="Profile" description="Manage your account details." />

      <ProfileForm user={user} onSaved={refreshUser} />

      <WalletManager />

      <div>
        <h2 className="u-display mb-4 text-xl">Enrollment History</h2>
        {isLoading ? (
          <LoadingState message="Loading enrollments…" />
        ) : enrollments.length === 0 ? (
          <EmptyState
            message="You are not enrolled in any cohorts yet."
            art={APP_ART.history}
          />
        ) : (
          <div className="space-y-3">
            {enrollments.map((e) => (
              <Card
                key={e.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{e.cohort.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Enrolled {format(new Date(e.enrolledAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {e.cohort.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Page;
