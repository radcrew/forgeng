"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@components/ui/button";
import type { FeedbackVerdict } from "@types";

export type VerdictPickerProps = {
  value: FeedbackVerdict;
  onChange: (verdict: FeedbackVerdict) => void;
};

export const VerdictPicker = ({ value, onChange }: VerdictPickerProps) => (
  <div className="flex gap-3">
    <Button
      type="button"
      variant={value === "approved" ? "default" : "outline"}
      size="sm"
      onClick={() => onChange("approved")}
      className="flex items-center gap-2"
    >
      <CheckCircle2 className="h-4 w-4" />
      Approve
    </Button>
    <Button
      type="button"
      variant={value === "needs_work" ? "destructive" : "outline"}
      size="sm"
      onClick={() => onChange("needs_work")}
      className="flex items-center gap-2"
    >
      <AlertCircle className="h-4 w-4" />
      Needs Work
    </Button>
  </div>
);
