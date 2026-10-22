"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils";
import type { NotificationPreferences } from "@types";

import { updateNotificationPreferences } from "../api";
import { useNotificationPreferences } from "../hooks";

type PrefKey = keyof NotificationPreferences;

interface PrefGroup {
  title: string;
  description: string;
  inApp: PrefKey;
  email: PrefKey;
  /** Null: there is no Slack switch, see `slackNote`. */
  slack: PrefKey | null;
  slackNote?: string;
}

const GROUPS: PrefGroup[] = [
  {
    title: "Submission feedback",
    description: "When a reviewer responds to your work.",
    inApp: "feedbackInApp",
    email: "feedbackEmail",
    slack: "feedbackSlack",
  },
  {
    title: "New tasks",
    description: "When a new task is published in your cohort.",
    inApp: "taskInApp",
    email: "taskEmail",
    // Always posted in the cohort's channel, so a message would repeat it.
    slack: null,
    slackNote: "Posted in your cohort's Slack channel",
  },
];

const COLUMNS = "grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-6";

export function NotificationPreferencesCard() {
  const { data, isLoading, error } = useNotificationPreferences();
  const [overrides, setOverrides] = useState<Partial<NotificationPreferences>>(
    {},
  );
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  const prefs = data ? { ...data, ...overrides } : null;

  const handleToggle = async (key: PrefKey, value: boolean) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch {
      // Revert the optimistic change on failure.
      setOverrides((prev) => ({ ...prev, [key]: !value }));
      toast.error("Couldn't update preferences.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
        <CardDescription>
          Choose how you want to hear about each kind of update. Slack
          messages start once you join the Forgeng Slack from your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !prefs ? (
          <PreferencesSkeleton />
        ) : error ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your preferences.
          </p>
        ) : (
          <div className="divide-y">
            <div
              className={cn(
                COLUMNS,
                "pb-2 text-xs font-medium text-muted-foreground",
              )}
            >
              <span />
              <span className="w-12 text-center">In-app</span>
              <span className="w-12 text-center">Email</span>
              <span className="w-12 text-center">Slack</span>
            </div>
            {GROUPS.map((group) => (
              <div key={group.title} className={cn(COLUMNS, "py-3")}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{group.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                </div>
                <div className="flex w-12 justify-center">
                  <Toggle
                    checked={prefs[group.inApp]}
                    disabled={savingKey === group.inApp}
                    onChange={(v) => void handleToggle(group.inApp, v)}
                    label={`${group.title} in-app notifications`}
                  />
                </div>
                <div className="flex w-12 justify-center">
                  <Toggle
                    checked={prefs[group.email]}
                    disabled={savingKey === group.email}
                    onChange={(v) => void handleToggle(group.email, v)}
                    label={`${group.title} email notifications`}
                  />
                </div>
                <div className="flex w-12 justify-center">
                  {group.slack ? (
                    <Toggle
                      checked={prefs[group.slack]}
                      disabled={savingKey === group.slack}
                      onChange={(v) =>
                        group.slack && void handleToggle(group.slack, v)
                      }
                      label={`${group.title} Slack messages`}
                    />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title={group.slackNote}
                      aria-label={group.slackNote}
                    >
                      Channel
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ToggleProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function Toggle({ checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary-strong" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}
