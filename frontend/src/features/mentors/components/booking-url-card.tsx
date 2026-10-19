"use client";

import { useState } from "react";
import { toast } from "sonner";

import { LoadingState } from "@components/common";
import { ErrorState } from "@components/shared";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { ApiError } from "@lib/api-client";

import { BOOKING_URL_MESSAGE, isBookingUrl } from "../booking-url";
import { useMyBookingUrl, useUpdateBookingUrl } from "../hooks";

type BookingUrlFormProps = {
  saved: string | null;
  onSaved: () => void;
};

const BookingUrlForm = ({ saved, onSaved }: BookingUrlFormProps) => {
  const { save, isPending } = useUpdateBookingUrl();
  const [value, setValue] = useState(saved ?? "");
  const [error, setError] = useState("");

  const submit = async (bookingUrl: string | null) => {
    try {
      await save(bookingUrl);
      toast.success(
        bookingUrl ? "Booking page saved." : "Booking page removed.",
      );
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save the link.",
      );
    }
  };

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Paste your booking page link first.");
      return;
    }
    if (!isBookingUrl(trimmed)) {
      setError(BOOKING_URL_MESSAGE);
      return;
    }
    setError("");
    void submit(trimmed);
  };

  const handleRemove = () => {
    setValue("");
    setError("");
    void submit(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bookingUrl">Booking page link</Label>
        <Input
          id="bookingUrl"
          type="url"
          placeholder="https://calendar.app.google/…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "bookingUrl-error" : undefined}
        />
        {error && (
          <p id="bookingUrl-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save link"}
        </Button>
        {saved && (
          <Button variant="outline" onClick={handleRemove} disabled={isPending}>
            Remove link
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * The signed-in admin's Google Calendar booking page. Students see it on
 * their dashboard and pick a free time for a meeting there.
 */
export const BookingUrlCard = () => {
  const { data, isLoading, error, refetch } = useMyBookingUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your booking page</CardTitle>
        <CardDescription>
          Students pick a free time for a meeting with you on this page. In
          Google Calendar, create an appointment schedule, open its booking
          page, and paste the link here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState what="your booking page" onRetry={refetch} size="compact" />
        ) : isLoading || !data ? (
          <LoadingState message="Loading your booking page…" />
        ) : (
          // A new key loads the saved link again after a save.
          <BookingUrlForm
            key={data.bookingUrl ?? ""}
            saved={data.bookingUrl}
            onSaved={refetch}
          />
        )}
      </CardContent>
    </Card>
  );
};
