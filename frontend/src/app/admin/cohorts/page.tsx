"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  mockCohorts,
  mockEnrollments,
  mockUsers,
} from "@/lib/mock-data";
import type { Cohort, CohortStatus } from "@/lib/types";

const STATUS_VARIANT: Record<CohortStatus, "default" | "secondary" | "outline"> =
  {
    active: "default",
    draft: "secondary",
    completed: "outline",
  };

function CohortFormDialog({
  cohort,
  open,
  onOpenChange,
}: {
  cohort?: Cohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!cohort;
  const [name, setName] = useState(cohort?.name ?? "");
  const [description, setDescription] = useState(cohort?.description ?? "");
  const [capacity, setCapacity] = useState(cohort?.capacity?.toString() ?? "20");
  const [status, setStatus] = useState<CohortStatus>(cohort?.status ?? "draft");
  const [startDate, setStartDate] = useState(
    cohort?.startDate?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(cohort?.endDate?.slice(0, 10) ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSaving(false);
    toast.success(isEdit ? "Cohort updated" : "Cohort created");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Cohort" : "Create Cohort"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2026 Cohort"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CohortStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name || isSaving}>
            {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnrollmentsDialog({
  cohort,
  open,
  onOpenChange,
}: {
  cohort: Cohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const enrollments = useMemo(
    () => mockEnrollments.filter((e) => e.cohortId === cohort.id),
    [cohort.id],
  );
  const enrolledIds = new Set(enrollments.map((e) => e.userId));
  const availableStudents = mockUsers.filter(
    (u) => u.role === "student" && !enrolledIds.has(u.id),
  );

  const [userId, setUserId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!userId) return;
    setIsEnrolling(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsEnrolling(false);
    toast.success("Student enrolled!");
    setUserId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{cohort.name} — Enrollments</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {enrollments.length} enrolled
          </p>

          {enrollments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {enrollments.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {e.user?.name ?? e.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enrolled{" "}
                      {format(new Date(e.enrolledAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No students enrolled yet.
            </p>
          )}

          {availableStudents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Enroll a Student</Label>
                <div className="flex gap-2">
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleEnroll} disabled={!userId || isEnrolling}>
                    Enroll
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCohortsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editCohort, setEditCohort] = useState<Cohort | undefined>(undefined);
  const [enrollCohort, setEnrollCohort] = useState<Cohort | undefined>(undefined);

  const handleDelete = (cohort: Cohort) => {
    if (!confirm(`Delete "${cohort.name}"? This cannot be undone.`)) return;
    toast.success("Cohort deleted");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cohorts</h1>
          <p className="text-muted-foreground mt-1">
            Manage cohorts and student enrollment.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCohort(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Cohort
        </Button>
      </div>

      {mockCohorts.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            No cohorts yet. Create your first cohort to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mockCohorts.map((cohort) => (
            <Card key={cohort.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{cohort.name}</CardTitle>
                  <Badge
                    variant={STATUS_VARIANT[cohort.status]}
                    className="capitalize"
                  >
                    {cohort.status}
                  </Badge>
                </div>
                {cohort.description && (
                  <p className="text-sm text-muted-foreground">
                    {cohort.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {cohort.enrolledCount} / {cohort.capacity} students
                  </span>
                </div>
                {cohort.startDate && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(cohort.startDate), "MMM d, yyyy")}
                    {cohort.endDate &&
                      ` → ${format(new Date(cohort.endDate), "MMM d, yyyy")}`}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnrollCohort(cohort)}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" /> Enrollments
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditCohort(cohort);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cohort)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CohortFormDialog
        cohort={editCohort}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditCohort(undefined);
        }}
      />

      {enrollCohort && (
        <EnrollmentsDialog
          cohort={enrollCohort}
          open={!!enrollCohort}
          onOpenChange={(open) => {
            if (!open) setEnrollCohort(undefined);
          }}
        />
      )}
    </div>
  );
}
