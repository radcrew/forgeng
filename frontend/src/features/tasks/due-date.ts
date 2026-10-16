/** Today's date in the viewer's time zone, as "YYYY-MM-DD". */
export const todayAsDateInput = (now = new Date()): string => {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * True when a due date picked in the form is already over. A date that was
 * saved before is left alone, so opening an old task doesn't warn again.
 */
export const isNewPastDueDate = (
  dueDate: string,
  savedDueDate: string,
  today: string,
): boolean =>
  // Dates are "YYYY-MM-DD", so comparing them as text gives the right order.
  !!dueDate && dueDate !== savedDueDate && dueDate < today;
