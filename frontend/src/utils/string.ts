/** Human-readable label from snake_case status values. */
export const formatStatusLabel = (status: string) =>
  status.replace(/_/g, " ");
