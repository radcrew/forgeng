"use client";

import { Button } from "@components/ui/button";
import { useCurrentUser } from "@contexts";
import type { OAuthProvider } from "@features/auth";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={className}
    width="18"
    height="18"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.5 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
    />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={className}
    width="18"
    height="18"
    fill="currentColor"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.93c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.74-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.05.78 2.12v3.14c0 .3.21.66.8.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

interface OAuthButtonsProps {
  /** Disable while another submit is in flight. */
  disabled?: boolean;
  /** Label prefix, e.g. "Sign in" or "Continue". */
  label?: string;
}

export const OAuthButtons = ({
  disabled = false,
  label = "Continue",
}: OAuthButtonsProps) => {
  const { startOAuth } = useCurrentUser();

  const handle = (provider: OAuthProvider) => () => {
    startOAuth(provider);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={handle("google")}
        disabled={disabled}
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        {label} with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handle("github")}
        disabled={disabled}
      >
        <GitHubIcon className="mr-2 h-4 w-4" />
        {label} with GitHub
      </Button>
    </div>
  );
};
