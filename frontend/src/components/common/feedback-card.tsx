"use client";

import { format } from "date-fns";

import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import type { FeedbackVerdict } from "@types";

export type FeedbackCardProps = {
  authorName: string;
  verdict: FeedbackVerdict;
  content: string;
  createdAt: string;
};

export const FeedbackCard = ({
  authorName,
  verdict,
  content,
  createdAt,
}: FeedbackCardProps) => (
  <Card
    className={
      verdict === "approved" ? "border-primary/40" : "border-destructive/40"
    }
  >
    <CardHeader className="pb-2 pt-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{authorName}</CardTitle>
        <Badge
          variant={verdict === "approved" ? "default" : "destructive"}
          className="text-xs"
        >
          {verdict === "approved" ? "Approved" : "Needs Work"}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-sm text-muted-foreground">{content}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {format(new Date(createdAt), "MMM d, yyyy")}
      </p>
    </CardContent>
  </Card>
);
