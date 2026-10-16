export const COHORT_NAME_MAX = 120;
export const COHORT_DESCRIPTION_MAX = 2000;

export type CohortErrors = {
  name?: string;
  description?: string;
  capacity?: string;
  endDate?: string;
};

/** Checks the cohort form. Returns an empty object when it is valid. */
export const validateCohort = (
  values: {
    name: string;
    description: string;
    capacity: string;
    startDate: string;
    endDate: string;
  },
  enrolledCount = 0,
): CohortErrors => {
  const errors: CohortErrors = {};
  const name = values.name.trim();
  const capacity = Number(values.capacity);

  if (!name) {
    errors.name = "Enter a name.";
  } else if (name.length > COHORT_NAME_MAX) {
    errors.name = `Keep the name under ${COHORT_NAME_MAX} characters.`;
  }

  if (values.description.length > COHORT_DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${COHORT_DESCRIPTION_MAX} characters.`;
  }

  if (!values.capacity.trim() || !Number.isInteger(capacity) || capacity < 1) {
    errors.capacity = "Enter a whole number of 1 or more.";
  } else if (capacity < enrolledCount) {
    errors.capacity = `${enrolledCount} students are already enrolled. Enter at least ${enrolledCount}.`;
  }

  // Dates are "YYYY-MM-DD", so comparing them as text gives the right order.
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = "The end date must be on or after the start date.";
  }

  return errors;
};
