"use client";

import { use, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Mail,
  MapPin,
  Monitor,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import {
  ExternalLinkField,
  LoadingState,
  ProseBlock,
  SectionTitle,
} from "@components/common";
import { PageContainer } from "@components/shared";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import { COHORT_STATUS_VARIANT } from "@constants/cohorts";
import { notifyWalletMissing, recordPayment } from "@features/users/api";
import { useUser, useUserEnrollments, useUserPaymentStats } from "@features/users/hooks";
import { ApiError } from "@lib/api-client";
import { resolveAssetUrl } from "@lib/config";

import { PaymentStatsChart } from "./_components/payment-stats-chart";

const CURRENCIES = ["USDT", "USDC", "ETH", "SOL", "BNB", "TRX", "USD"];

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = Number(id);

  const { data: user, isLoading } = useUser(userId);
  const { data: enrollments = [], isLoading: enrollmentsLoading } =
    useUserEnrollments(userId);
  const { data: paymentStats, refetch: refetchStats } =
    useUserPaymentStats(userId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingWalletReminder, setSendingWalletReminder] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const walletsEmpty =
    !paymentStats || paymentStats.wallets.length === 0;

  const handleNotifyWalletMissing = async () => {
    setSendingWalletReminder(true);
    try {
      await notifyWalletMissing(userId);
      toast.success("Reminder sent — student notified to add their wallet.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send reminder.",
      );
    } finally {
      setSendingWalletReminder(false);
    }
  };

  const openDialog = () => {
    setAmount("");
    setNote("");
    setCurrency("USDT");
    setDialogOpen(true);
  };

  const handleRecord = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      amountRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await recordPayment(userId, {
        amount: parsed,
        currency,
        note: note.trim() || undefined,
      });
      toast.success("Payment recorded and student notified by email.");
      setDialogOpen(false);
      refetchStats();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to record payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading user…" />
      </PageContainer>
    );
  }

  const displayName = user.name ?? user.email;

  return (
    <PageContainer maxWidth="2xl">
      <div className="space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All users
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveAssetUrl(user.avatarUrl)}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary shrink-0">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-xl font-semibold truncate">{displayName}</h1>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user.email}
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
              {user.emailVerified && (
                <Badge variant="outline" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <div>
              <SectionTitle>Joined</SectionTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(user.createdAt), "MMMM d, yyyy")}
              </p>
            </div>

            {(user.registrationIp ||
              user.registrationCity ||
              user.registrationCountry) && (
              <div>
                <SectionTitle>Registration</SectionTitle>
                <div className="space-y-1.5">
                  {user.registrationIp && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Monitor className="h-3.5 w-3.5 shrink-0" />
                      {user.registrationIp}
                    </p>
                  )}
                  {(user.registrationCity || user.registrationCountry) && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {[user.registrationCity, user.registrationCountry]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <SectionTitle>Bio</SectionTitle>
              {user.bio ? (
                <ProseBlock className="whitespace-pre-wrap">{user.bio}</ProseBlock>
              ) : (
                <p className="text-sm text-muted-foreground">No bio provided.</p>
              )}
            </div>

            {(user.linkedin ||
              user.github ||
              user.twitter ||
              user.facebook ||
              user.portfolio) && (
              <div className="space-y-2">
                <SectionTitle>Social profiles</SectionTitle>
                {user.linkedin && (
                  <ExternalLinkField href={user.linkedin} title="LinkedIn" />
                )}
                {user.github && (
                  <ExternalLinkField href={user.github} title="GitHub" />
                )}
                {user.twitter && (
                  <ExternalLinkField href={user.twitter} title="X / Twitter" />
                )}
                {user.facebook && (
                  <ExternalLinkField href={user.facebook} title="Facebook" />
                )}
                {user.portfolio && (
                  <ExternalLinkField href={user.portfolio} title="Portfolio" />
                )}
              </div>
            )}

            {(user.telegram || user.whatsapp) && (
              <div className="space-y-1.5">
                <SectionTitle>Contact</SectionTitle>
                {user.telegram && (
                  <p className="text-sm text-muted-foreground">
                    Telegram: {user.telegram}
                  </p>
                )}
                {user.whatsapp && (
                  <p className="text-sm text-muted-foreground">
                    WhatsApp: {user.whatsapp}
                  </p>
                )}
              </div>
            )}

            {/* Wallet addresses */}
            <div className="space-y-2">
              <SectionTitle>Wallet addresses</SectionTitle>
              {walletsEmpty ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 space-y-2.5">
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No wallet address added — payment cannot be processed.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={sendingWalletReminder}
                    onClick={handleNotifyWalletMissing}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    {sendingWalletReminder ? "Sending…" : "Email student to add wallet"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {paymentStats!.wallets.map((w) => (
                    <div
                      key={w.chain}
                      className="rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <p className="text-xs font-medium capitalize">{w.chain}</p>
                      <p className="text-xs text-muted-foreground font-mono break-all mt-0.5">
                        {w.address}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Monthly Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Monthly chart */}
                {paymentStats && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Last 6 months
                    </p>
                    <PaymentStatsChart stats={paymentStats.monthlyStats} />
                  </div>
                )}

                <Separator />

                <Button
                  onClick={openDialog}
                  disabled={walletsEmpty}
                  className="w-full"
                  title={
                    walletsEmpty
                      ? "Student must add a wallet address first"
                      : undefined
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Record payment &amp; notify student
                </Button>
              </CardContent>
            </Card>

            {/* Enrollments */}
            <div>
              <SectionTitle>Enrollments</SectionTitle>
              {enrollmentsLoading ? (
                <LoadingState message="Loading enrollments…" />
              ) : enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not enrolled in any cohort.
                </p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {e.cohort.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled{" "}
                          {format(new Date(e.enrolledAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant={COHORT_STATUS_VARIANT[e.cohort.status]}
                        className="shrink-0 capitalize"
                      >
                        {e.cohort.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record payment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  ref={amountRef}
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="note"
                placeholder="e.g. June 2026 stipend"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              This will record the payment and send {user.name ?? user.email} an
              email confirmation.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleRecord} disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Sending…" : "Confirm & notify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
