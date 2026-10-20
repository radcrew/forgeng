"use client";

import { useCallback, useState } from "react";
import { useAsyncResource } from "@hooks/use-async-resource";
import { getSlackInvite, updateSlackInvite } from "./api";

export const useSlackInvite = () => useAsyncResource(getSlackInvite, []);

export const useUpdateSlackInvite = () => {
  const [isPending, setIsPending] = useState(false);

  const save = useCallback(async (slackInviteUrl: string | null) => {
    setIsPending(true);
    try {
      return await updateSlackInvite(slackInviteUrl);
    } finally {
      setIsPending(false);
    }
  }, []);

  return { save, isPending };
};
