"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingState } from "@components/common";
import { ErrorState } from "@components/shared";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { ApiError } from "@lib/api-client";

import { SLACK_INVITE_MESSAGE, isSlackInviteUrl } from "../invite-url";
import { useSlackInvite, useUpdateSlackInvite } from "../hooks";

type SlackInviteFormProps = {
  saved: string | null;
  onSaved: () => void;
};

const SlackInviteForm = ({ saved, onSaved }: SlackInviteFormProps) => {
  const { save, isPending } = useUpdateSlackInvite();
  const [value, setValue] = useState(saved ?? "");
  const [error, setError] = useState("");

  const submit = async (slackInviteUrl: string | null) => {
    try {
      await save(slackInviteUrl);
      toast.success(
        slackInviteUrl ? "Slack invite link saved." : "Slack invite link removed.",
      );
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save the link.",
      );
    }
  };

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste the Slack invite link first.");
      return;
    }
    if (!isSlackInviteUrl(trimmed)) {
      setError(SLACK_INVITE_MESSAGE);
      return;
    }
    setError("");
    void submit(trimmed);
  };

  const handleRemove = () => {
    setValue("");
    setError("");
    void submit(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="slackInviteUrl">Slack invite link</Label>
        <Input
          id="slackInviteUrl"
          type="url"
          placeholder="https://join.slack.com/t/…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "slackInviteUrl-error" : undefined}
        />
        {error && (
          <p id="slackInviteUrl-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save link"}
        </Button>
        {saved && (
          <Button variant="outline" onClick={handleRemove} disabled={isPending}>
            Remove link
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * The invite link to the Forgeng Slack workspace. Students see it on their
 * dashboard. Applicants don't, so only accepted people can join.
 */
export const SlackInviteCard = () => {
  const { data, isLoading, error, refetch } = useSlackInvite();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slack community</CardTitle>
        <CardDescription>
          Students see a &quot;Join the Forgeng Slack&quot; button with this
          link on their dashboard. Applicants don&apos;t. In Slack, open the
          workspace menu, choose to invite people, and copy an invite link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            what="the Slack invite link"
            onRetry={refetch}
            size="compact"
          />
        ) : isLoading || !data ? (
          <LoadingState message="Loading the Slack invite link…" />
        ) : (
          // A new key loads the saved link again after a save.
          <SlackInviteForm
            key={data.slackInviteUrl ?? ""}
            saved={data.slackInviteUrl}
            onSaved={refetch}
          />
        )}
      </CardContent>
    </Card>
  );
};
