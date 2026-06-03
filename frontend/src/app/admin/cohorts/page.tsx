"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@components/ui/button";
import { LoadingState } from "@components/common";
import { EmptyState, PageContainer, PageHeader } from "@components/shared";
import {
  Card,
  Enrollments,
  FormDialog,
  useCohorts,
} from "@features/cohorts";
import type { Cohort } from "@types";

const Page = () => {
  const { data: cohorts = [], isLoading, refetch } = useCohorts();
  const [formOpen, setFormOpen] = useState(false);
  const [editCohort, setEditCohort] = useState<Cohort | undefined>(undefined);
  const [enrollCohort, setEnrollCohort] = useState<Cohort | undefined>(undefined);

  return (
    <PageContainer maxWidth="5xl">
      <PageHeader
        title="Cohorts"
        description="Manage cohorts and student enrollment."
        actions={
          <Button
            onClick={() => {
              setEditCohort(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Cohort
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading cohorts…" />
      ) : cohorts.length === 0 ? (
        <EmptyState message="No cohorts yet. Create your first cohort to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohorts.map((cohort) => (
            <Card
              key={cohort.id}
              cohort={cohort}
              onEnrollments={setEnrollCohort}
              onEdit={(c) => {
                setEditCohort(c);
                setFormOpen(true);
              }}
              onDeleted={refetch}
            />
          ))}
        </div>
      )}

      <FormDialog
        key={editCohort?.id ?? "new"}
        cohort={editCohort}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditCohort(undefined);
        }}
        onSaved={refetch}
      />

      {enrollCohort && (
        <Enrollments
          cohort={enrollCohort}
          open={!!enrollCohort}
          onOpenChange={(open) => {
            if (!open) setEnrollCohort(undefined);
          }}
          onEnrolled={refetch}
        />
      )}
    </PageContainer>
  );
};

export default Page;
