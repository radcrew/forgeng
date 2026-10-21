"use client";

import { PageContainer, PageHeader } from "@components/shared";
import { SlackInviteCard } from "@features/slack";

const Page = () => (
  <PageContainer maxWidth="reading" spacing="8">
    <PageHeader
      title="Integrations"
      description="Connect Forgeng to the outside tools that students and mentors use."
    />
    <SlackInviteCard />
  </PageContainer>
);

export default Page;
