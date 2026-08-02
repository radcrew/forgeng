"use client";

import { use, useRef, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
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
import { Avatar } from "@components/ui/avatar";
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
import { CURRENCIES } from "@constants/payments";
import { useUser, useUserEnrollments, useUserPaymentStats, useRecordPayment, useNotifyWalletMissing } from "@features/users/hooks";
import { useSettings } from "@features/settings";
import { ApiError } from "@lib/api-client";
import { isProfileComplete } from "@utils/user";

import { PaymentStatsChart } from "./_components/payment-stats-chart";

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

  const { record, isPending: submitting } = useRecordPayment();
  const { notify: notifyWallet, isPending: sendingWalletReminder } = useNotifyWalletMissing();
  const { data: platformSettings } = useSettings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [txLink, setTxLink] = useState("");
  const [note, setNote] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  const walletsEmpty =
    !paymentStats || paymentStats.wallets.length === 0;

  const handleNotifyWalletMissing = async () => {
    try {
      await notifyWallet(userId);
      toast.success("Reminder sent — student notified to add their wallet.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to send reminder.",
      );
    }
  };

  const openDialog = () => {
    setAmount("");
    setCurrency("USDT");
    setTxLink("");
    setNote("");
    setDialogOpen(true);
  };

  const handleRecord = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      amountRef.current?.focus();
      return;
    }
    try {
      await record(userId, {
        amount: parsed,
        currency,
        txLink: txLink.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast.success("Payment recorded and student notified by email.");
      setDialogOpen(false);
      refetchStats();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to record payment.",
      );
    }
  };

  if (isLoading || !user) {
    return (
      <PageContainer maxWidth="5xl">
        <LoadingState message="Loading user…" />
      </PageContainer>
    );
  }

  const displayName = user.name ?? user.email;
  const profileIncomplete = !isProfileComplete(user);

  return (
    <PageContainer maxWidth="5xl">
      <div className="space-y-6">
        {/* Back */}
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground inline-block"
        >
          ← Back to Users
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar
            src={user.avatarUrl}
            name={user.name}
            email={user.email}
            size={64}
          />
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-xl font-semibold truncate">{displayName}</h1>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {user.email}
            </span>
          </div>
        </div>

        {profileIncomplete && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              This student has not completed their profile. Do not approve them
              for a cohort or assign tasks until all profile fields are filled
              in.
            </p>
          </div>
        )}

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
                  <SectionTitle>IP</SectionTitle>
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
                <ProseBlock className="whitespace-pre-wrap bg-transparent p-0">
                  {user.bio}
                </ProseBlock>
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
              <SectionTitle>Wallet address</SectionTitle>
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
                <div className="space-y-3">
                  {paymentStats!.wallets.map((w) => (
                    <div key={w.chain}>
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
              {platformSettings && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: "Month 1", value: platformSettings.stipendMonth1 },
                    { label: "Month 2", value: platformSettings.stipendMonth2 },
                    { label: "Month 3", value: platformSettings.stipendMonth3 },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setAmount(value);
                        setCurrency("USD");
                      }}
                      className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {label} (${value})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txLink">
                Transaction Link{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="txLink"
                type="url"
                placeholder="https://etherscan.io/tx/0x…"
                value={txLink}
                onChange={(e) => setTxLink(e.target.value)}
              />
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
