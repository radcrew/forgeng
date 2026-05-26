"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Textarea } from "@components/ui/textarea";
import { mockApplications, mockCohorts } from "@lib/mock-data";
import type { Application, ApplicationStatus } from "@lib/types";

type StatusFilter = ApplicationStatus | "all";

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  reviewing: "outline",
  accepted: "default",
  rejected: "destructive",
};

function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
}: {
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [reviewerNote, setReviewerNote] = useState(application.reviewerNote ?? "");
  const [cohortId, setCohortId] = useState<string>(
    application.cohortId?.toString() ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSaving(false);
    toast.success("Application updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {application.firstName} {application.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{application.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Applied</p>
              <p className="font-medium">
                {format(new Date(application.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {application.motivation && (
            <div>
              <p className="text-sm font-semibold mb-1">Motivation</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.motivation}
              </p>
            </div>
          )}

          {application.background && (
            <div>
              <p className="text-sm font-semibold mb-1">Background</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.background}
              </p>
            </div>
          )}

          {application.experience && (
            <div>
              <p className="text-sm font-semibold mb-1">Experience</p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {application.experience}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ApplicationStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "accepted" && mockCohorts.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to Cohort</Label>
              <Select value={cohortId} onValueChange={setCohortId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cohort..." />
                </SelectTrigger>
                <SelectContent>
                  {mockCohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reviewer Note</Label>
            <Textarea
              placeholder="Internal notes about this application..."
              rows={3}
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const applications = useMemo(() => {
    if (filter === "all") return mockApplications;
    return mockApplications.filter((a) => a.status === filter);
  }, [filter]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage applicants through the pipeline.
        </p>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as StatusFilter)}
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {applications.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No applications in this category.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card
              key={app.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelected(app)}
            >
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold">
                    {app.firstName} {app.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(app.createdAt), "MMM d, yyyy")}
                  </span>
                  <Badge
                    variant={STATUS_VARIANT[app.status]}
                    className="capitalize"
                  >
                    {app.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ApplicationDetailDialog
          application={selected}
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </div>
  );
}
