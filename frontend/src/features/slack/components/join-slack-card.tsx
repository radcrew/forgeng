"use client";

import { MessagesSquare } from "lucide-react";

import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";

import { useSlackInvite } from "../hooks";
import { isSlackInviteUrl } from "../invite-url";

/**
 * Invites a student to the Forgeng Slack community. Shows nothing until an
 * admin adds the invite link, or when the link can't be loaded: the rest of
 * the dashboard doesn't depend on it.
 */
export const JoinSlackCard = () => {
  const { data } = useSlackInvite();
  const link = data?.slackInviteUrl;
  // The server only saves Slack links. Checking again here means a bad value
  // can never become a link on the page.
  if (!link || !isSlackInviteUrl(link)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessagesSquare className="h-4 w-4" />
          Join the Forgeng Slack
        </CardTitle>
        <CardDescription>
          Ask questions, get help from mentors, and meet the other students in
          your cohort.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <a href={link} target="_blank" rel="noopener noreferrer">
            Join Slack
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
