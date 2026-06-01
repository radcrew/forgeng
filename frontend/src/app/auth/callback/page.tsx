"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@components/brand/logo";
import { getMe } from "@features/auth";
import { writeAccessToken } from "@lib/session";
import { homeForRole } from "@utils/auth";

const CallbackInner = () => {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    if (!accessToken) {
      toast.error("Could not complete sign-in.");
      router.replace("/sign-in");
      return;
    }

    let cancelled = false;
    writeAccessToken(accessToken);
    void (async () => {
      try {
        const user = await getMe();
        if (cancelled) return;
        toast.success(`Signed in as ${user.name ?? user.email}.`);
        router.replace(homeForRole(user.role));
      } catch {
        if (cancelled) return;
        toast.error("Sign-in succeeded but loading your profile failed.");
        router.replace("/sign-in");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size={32} priority />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
      </div>
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <CallbackInner />
  </Suspense>
);

export default Page;
