"use client";

import { useAsyncResource } from "@hooks/use-async-resource";

import { listEnrollments } from "./api";

export const useEnrollments = () =>
  useAsyncResource(() => listEnrollments(), []);
