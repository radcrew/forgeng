"use client";

import { format } from "date-fns";
import { BadgeCheck, Mail, MapPin, Monitor } from "lucide-react";

import {
  DetailSheet,
  ExternalLinkField,
  LoadingState,
  ProseBlock,
  SectionTitle,
} from "@components/common";
import { Badge } from "@components/ui/badge";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { resolveAssetUrl } from "@lib/config";
import type { UserProfile } from "@types";

import { useUserEnrollments } from "../hooks";

export type ProfileSheetProps = {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
};

export const ProfileSheet = ({ user, open, onClose }: ProfileSheetProps) => {
  // Only fetch while the sheet is open; null short-circuits the request.
  const { data: enrollments = [], isLoading } = useUserEnrollments(
    open ? user.id : null,
  );

  const displayName = user.name ?? user.email;

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={displayName}
      subtitle={
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-all">{user.email}</span>
        </span>
      }
    >
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user avatar served by the API, not a static asset
          <img
            src={resolveAssetUrl(user.avatarUrl)}
            alt={displayName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
          {user.emailVerified && (
            <Badge variant="outline" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Joined</SectionTitle>
        <p className="text-sm text-muted-foreground">
          {format(new Date(user.createdAt), "MMMM d, yyyy")}
        </p>
      </div>

      {(user.registrationIp || user.registrationCity || user.registrationCountry) && (
        <div>
          <SectionTitle>IP</SectionTitle>
          <div className="space-y-1.5">
            {user.registrationIp && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-3.5 w-3.5 shrink-0" />
                {user.registrationIp}
              </p>
            )}
            {(user.registrationCity || user.registrationCountry) && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {[user.registrationCity, user.registrationCountry]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Bio</SectionTitle>
        {user.bio ? (
          <ProseBlock className="whitespace-pre-wrap">{user.bio}</ProseBlock>
        ) : (
          <p className="text-sm text-muted-foreground">No bio provided.</p>
        )}
      </div>

      {user.githubUrl && (
        <ExternalLinkField href={user.githubUrl} title="GitHub" />
      )}

      <div>
        <SectionTitle>Enrollments</SectionTitle>
        {isLoading ? (
          <LoadingState message="Loading enrollments…" />
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not enrolled in any cohort.
          </p>
        ) : (
          <div className="space-y-2">
            {enrollments.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.cohort.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enrolled {format(new Date(e.enrolledAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge
                  variant={COHORT_STATUS_VARIANT[e.cohort.status]}
                  className="shrink-0 capitalize"
                >
                  {e.cohort.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </DetailSheet>
  );
};
