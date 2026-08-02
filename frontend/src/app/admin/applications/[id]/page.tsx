"use client";

import { useParams } from "next/navigation";
import { PageContainer } from "@components/shared";
import { ApplicationDetailPage } from "@features/applications/components/application-detail-page";

const Page = () => {
  const params = useParams<{ id: string }>();
  return (
    <PageContainer>
      <ApplicationDetailPage id={Number(params?.id)} />
    </PageContainer>
  );
};

export default Page;
