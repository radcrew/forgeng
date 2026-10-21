"use client";

import {
  type MouseEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

import { FormDialog, LoadingState } from "@components/common";
import { ErrorState } from "@components/shared";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { ApiError } from "@lib/api-client";

import { getGoogleCalendarStatus, googleCalendarConnectUrl } from "../api";
import { CONNECT_RESULTS, CONNECT_RESULT_PARAM } from "../connect-result";
import { useDisconnectGoogleCalendar, useGoogleCalendarStatus } from "../hooks";

/**
 * Shows the result Google's page sent back, once, then removes it from the
 * address. Separate from the card because `useSearchParams` must sit inside
 * a Suspense boundary, or the production build of the page fails.
 */
const ConnectResult = ({ onResult }: { onResult: () => void }) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const result = params.get(CONNECT_RESULT_PARAM);
  // Each result is shown once, even if the page renders again before the
  // address is cleaned up.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!result || handled.current === result) return;
    handled.current = result;
    const shown = CONNECT_RESULTS[result] ?? CONNECT_RESULTS.token;
    if (shown.ok) toast.success(shown.message);
    else toast.error(shown.message);
    onResult();
    // So a reload doesn't show the message again.
    router.replace(pathname);
  }, [result, onResult, router, pathname]);

  return null;
};

/**
 * Lets the signed-in admin connect their Google Calendar, so meetings they
 * schedule with students go straight into it with a Meet link.
 */
export const GoogleCalendarCard = () => {
  const { data, isLoading, error, refetch } = useGoogleCalendarStatus();
  const { disconnect, isPending } = useDisconnectGoogleCalendar();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Google Calendar disconnected.");
      setConfirmOpen(false);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to disconnect.",
      );
    }
  };

  // The browser opens the connect link itself, so nothing refreshes an
  // expired sign-in on the way, and the server would answer 401. A normal
  // API call first refreshes the sign-in when needed.
  const handleConnect = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const href = event.currentTarget.href;
    try {
      await getGoogleCalendarStatus();
      window.location.assign(href);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to connect Google Calendar.",
      );
    }
  };

  const connectButton = (label: string) => (
    <Button asChild>
      <a
        href={googleCalendarConnectUrl()}
        onClick={(event) => void handleConnect(event)}
      >
        {label}
      </a>
    </Button>
  );

  return (
    <Card>
      <Suspense fallback={null}>
        <ConnectResult onResult={refetch} />
      </Suspense>
      <CardHeader>
        <CardTitle className="text-base">Google Calendar</CardTitle>
        <CardDescription>
          Meetings you schedule with students go into your Google Calendar,
          with a Google Meet link. Google emails each student the invite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState
            what="your Google Calendar connection"
            onRetry={refetch}
            size="compact"
          />
        ) : isLoading || !data ? (
          <LoadingState message="Loading your Google Calendar connection…" />
        ) : !data.configured ? (
          <p className="text-sm text-muted-foreground">
            Google Calendar is not set up on this server yet. Ask the person
            who runs Forgeng to add the Google Calendar settings.
          </p>
        ) : !data.connected ? (
          connectButton("Connect Google Calendar")
        ) : (
          <div className="space-y-4">
            {data.broken ? (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Google stopped accepting Forgeng&apos;s access to{" "}
                {data.googleEmail}. Connect again to schedule meetings.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm">
                <CalendarCheck className="h-4 w-4 shrink-0 text-primary-strong" />
                Connected as{" "}
                <span className="font-medium">{data.googleEmail}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {data.broken && connectButton("Connect again")}
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <FormDialog
        open={confirmOpen}
        onOpenChange={(open) => !isPending && setConfirmOpen(open)}
        title="Disconnect Google Calendar?"
        size="sm"
        actions={{
          onSubmit: () => void handleDisconnect(),
          submitLabel: "Disconnect",
          loadingLabel: "Disconnecting...",
          isLoading: isPending,
          submitVariant: "destructive",
        }}
      >
        <p className="text-sm text-muted-foreground">
          You won&apos;t be able to schedule meetings until you connect again.
          Meetings already in your calendar stay there.
        </p>
      </FormDialog>
    </Card>
  );
};
