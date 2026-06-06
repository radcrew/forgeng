import { redirect } from "next/navigation";

import { APPLICATION_STEP_SLUGS } from "@constants/applications";

const Page = () => {
  redirect(`/apply/${APPLICATION_STEP_SLUGS[0]}`);
};

export default Page;
