"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { ProseBlock, SectionTitle } from "@components/common";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Skeleton } from "@components/ui/skeleton";
import { Textarea } from "@components/ui/textarea";
import { APPLICATION_STATUS_OPTIONS } from "@constants/applications";
import { useCohorts } from "@features/cohorts";
import { useAsyncResource } from "@hooks/use-async-resource";
import { resolveAssetUrl } from "@lib/config";
import type { ApplicationStatus } from "@types";
import { getApplication } from "../api";
import { useUpdateApplicationStatus } from "../hooks";
import { StatusBadge } from "./status-badge";

const SOCIAL_LINKS = [
  { key: "linkedin" as const, label: "LinkedIn" },
  { key: "github" as const, label: "GitHub" },
  { key: "twitter" as const, label: "Twitter / X" },
  { key: "facebook" as const, label: "Facebook" },
  { key: "portfolio" as const, label: "Portfolio" },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

const CHAIN_LABELS: Record<string, string> = {
  evm: "EVM",
  solana: "Solana",
  tron: "Tron",
};

interface Props {
  id: number;
}

export const ApplicationDetailPage = ({ id }: Props) => {
  const { data: application, isLoading } = useAsyncResource(
    () => getApplication(id),
    [id],
  );
  const { data: cohorts = [] } = useCohorts();

  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [reviewerNote, setReviewerNote] = useState<string | null>(null);
  const [cohortId, setCohortId] = useState<string | null>(null);

  const { update, isPending: isSaving } = useUpdateApplicationStatus();

  const resolvedStatus = (status ?? application?.status) as ApplicationStatus | undefined;
  const resolvedNote = reviewerNote ?? application?.reviewerNote ?? "";
  const resolvedCohortId = cohortId ?? application?.cohortId?.toString() ?? "";

  const handleSave = async () => {
    if (!application) return;
    try {
      await update(application.id, {
        status: resolvedStatus!,
        reviewerNote: resolvedNote || null,
        cohortId:
          resolvedStatus === "accepted" && resolvedCohortId
            ? Number.parseInt(resolvedCohortId, 10)
            : null,
      });
      toast.success("Application updated");
    } catch {
      toast.error("Failed to update application");
    }
  };

  if (isLoading || !application) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hasSocialLinks = SOCIAL_LINKS.some(({ key }) => !!application[key]);
  const hasContact = application.telegram || application.whatsapp || application.address;
  const hasWallets = application.wallets && application.wallets.length > 0;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/applications"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Applications
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            {application.firstName} {application.lastName}
          </h1>
          <StatusBadge status={application.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {application.email} · Applied{" "}
          {format(new Date(application.createdAt), "MMM d, yyyy")}
        </p>
      </div>

      {/* Video */}
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
        {/* Left: application content */}
        <div className="space-y-5 lg:col-span-2">
          {application.motivation && (
            <div>
              <SectionTitle className="mb-2">Motivation</SectionTitle>
              <ProseBlock>{application.motivation}</ProseBlock>
            </div>
          )}
          {application.background && (
            <div>
              <SectionTitle className="mb-2">Background</SectionTitle>
              <ProseBlock>{application.background}</ProseBlock>
            </div>
          )}
          {application.experience && (
            <div>
              <SectionTitle className="mb-2">Experience</SectionTitle>
              <ProseBlock>{application.experience}</ProseBlock>
            </div>
          )}
          {hasSocialLinks && (
            <div>
              <SectionTitle className="mb-2">Social Profiles</SectionTitle>
              <div className="space-y-2 text-sm">
                {SOCIAL_LINKS.filter(({ key }) => !!application[key]).map(
                  ({ key, label }) => (
                    <div key={key} className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground shrink-0">{label}</span>
                      <a
                        href={application[key]!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs break-all text-right hover:underline"
                      >
                        {application[key]}
                      </a>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
          {hasContact && (
            <div>
              <SectionTitle className="mb-2">Contact</SectionTitle>
              <div className="space-y-2 text-sm">
                {application.telegram && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telegram</span>
                    <span className="font-mono text-xs flex items-center">
                      {application.telegram}
                      <CopyButton text={application.telegram} />
                    </span>
                  </div>
                )}
                {application.whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span className="font-mono text-xs flex items-center">
                      {application.whatsapp}
                      <CopyButton text={application.whatsapp} />
                    </span>
                  </div>
                )}
                {application.address && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Address</span>
                    <span className="text-xs text-right whitespace-pre-line">{application.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: admin panel + profiles */}
        <div className="space-y-4">
          {/* Admin controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Status</p>
                <Select
                  value={resolvedStatus}
                  onValueChange={(v) => setStatus(v as ApplicationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUS_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {resolvedStatus === "accepted" && cohorts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Assign to Cohort</p>
                  <Select value={resolvedCohortId} onValueChange={setCohortId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cohort…" />
                    </SelectTrigger>
                    <SelectContent>
                      {cohorts.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Reviewer Note</p>
                <Textarea
                  placeholder="Internal notes…"
                  rows={3}
                  value={resolvedNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </CardContent>
          </Card>

          {/* Wallets */}
          {hasWallets && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Wallet Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.wallets!.map((w, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {CHAIN_LABELS[w.chain] ?? w.chain}
                    </p>
                    <div className="flex items-center">
                      <span className="font-mono text-xs break-all">{w.address}</span>
                      <CopyButton text={w.address} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
