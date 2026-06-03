"use client";

import { useParams } from "next/navigation";

import { CohortDetail } from "@features/cohorts";

const Page = () => {
  const params = useParams<{ id: string }>();
  return <CohortDetail cohortId={Number(params?.id)} />;
};

export default Page;
