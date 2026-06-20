import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE_NAME, verifyAccessToken } from "@lib/auth/access-token";
import { homeForRole } from "@utils/auth";

const Page = async () => {
  const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  const payload = token ? await verifyAccessToken(token) : null;

  if (!payload) {
    redirect("/sign-in");
  }

  redirect(homeForRole(payload.role));
};

export default Page;
