export const SUBMISSION_CONTENT_MAX = 8000;

export type SubmissionErrors = {
  repoUrl?: string;
  content?: string;
};

const isWebUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.includes(".")
    );
  } catch {
    return false;
  }
};

/** Checks a submission form. Returns an empty object when it is valid. */
export const validateSubmission = (values: {
  repoUrl: string;
  content: string;
}): SubmissionErrors => {
  const repoUrl = values.repoUrl.trim();
  const content = values.content.trim();
  const errors: SubmissionErrors = {};

  if (repoUrl && !isWebUrl(repoUrl)) {
    errors.repoUrl = "Enter a full link that starts with https://";
  }
  if (!repoUrl && !content) {
    errors.content = "Add a repository link or a write-up.";
  }
  if (content.length > SUBMISSION_CONTENT_MAX) {
    errors.content = `Keep the write-up under ${SUBMISSION_CONTENT_MAX} characters.`;
  }
  return errors;
};
