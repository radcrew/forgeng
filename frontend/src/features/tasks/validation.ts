import type { TaskStatus } from "@types";

export const TASK_TITLE_MAX = 200;
export const TASK_DESCRIPTION_MAX = 8000;

export type TaskErrors = {
  title?: string;
  description?: string;
  cohortId?: string;
  dueDate?: string;
};

/** Checks the task form. Returns an empty object when it is valid. */
export const validateTask = (values: {
  title: string;
  description: string;
  cohortId: string;
  status: TaskStatus;
  dueDate: string;
  /** True when editing a task that is already published. */
  wasPublished?: boolean;
}): TaskErrors => {
  const errors: TaskErrors = {};
  const title = values.title.trim();

  if (!title) {
    errors.title = "Enter a title.";
  } else if (title.length > TASK_TITLE_MAX) {
    errors.title = `Keep the title under ${TASK_TITLE_MAX} characters.`;
  }

  if (values.description.length > TASK_DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${TASK_DESCRIPTION_MAX} characters.`;
  }

  if (!values.cohortId) {
    errors.cohortId = "Select a cohort.";
  }

  // The stipend counts tasks by the month they are due, so publishing needs a
  // due date. Drafts can wait. A task published before this rule may have no
  // date; it can still be edited, so a typo fix isn't blocked.
  if (
    values.status === "published" &&
    !values.wasPublished &&
    !values.dueDate
  ) {
    errors.dueDate = "Add a due date before publishing.";
  }

  return errors;
};
