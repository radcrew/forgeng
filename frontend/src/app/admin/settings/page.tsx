"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { PageContainer, PageHeader } from "@components/shared";
import { LoadingState } from "@components/common";
import { CURRENCIES } from "@constants/payments";
import { useSettings, useUpdateSettings, type PlatformSettings } from "@features/settings";
import { ApiError } from "@lib/api-client";

type SettingsFormProps = {
  settings: PlatformSettings;
  onSaved: () => void;
};

const SettingsForm = ({ settings, onSaved }: SettingsFormProps) => {
  const { save, isPending } = useUpdateSettings();

  const [month1, setMonth1] = useState(settings.stipendMonth1);
  const [month2, setMonth2] = useState(settings.stipendMonth2);
  const [month3, setMonth3] = useState(settings.stipendMonth3);
  const [currency, setCurrency] = useState(settings.stipendCurrency);

  const handleSave = async () => {
    const m1 = parseFloat(month1);
    const m2 = parseFloat(month2);
    const m3 = parseFloat(month3);

    if (!month1 || isNaN(m1) || m1 <= 0) {
      toast.error("Month 1 stipend must be a positive number.");
      return;
    }
    if (!month2 || isNaN(m2) || m2 <= 0) {
      toast.error("Month 2 stipend must be a positive number.");
      return;
    }
    if (!month3 || isNaN(m3) || m3 <= 0) {
      toast.error("Month 3 stipend must be a positive number.");
      return;
    }

    try {
      await save({
        stipendMonth1: m1,
        stipendMonth2: m2,
        stipendMonth3: m3,
        stipendCurrency: currency,
      });
      toast.success("Stipend settings saved.");
      onSaved();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save settings.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Stipend Amounts</CardTitle>
        <CardDescription>
          Set the default stipend for each month of a student&apos;s program.
          These appear as presets when recording a payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="month1">Month 1</Label>
            <Input
              id="month1"
              type="number"
              min="0.01"
              step="any"
              placeholder="30"
              value={month1}
              onChange={(e) => setMonth1(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="month2">Month 2</Label>
            <Input
              id="month2"
              type="number"
              min="0.01"
              step="any"
              placeholder="50"
              value={month2}
              onChange={(e) => setMonth2(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="month3">Month 3</Label>
            <Input
              id="month3"
              type="number"
              min="0.01"
              step="any"
              placeholder="100"
              value={month3}
              onChange={(e) => setMonth3(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5 max-w-[160px]">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency">
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

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

const Page = () => {
  const { data: settings, isLoading, refetch } = useSettings();

  return (
    <PageContainer maxWidth="4xl" spacing="8">
      <PageHeader
        title="Settings"
        description="Platform-wide configuration for stipend payouts."
      />
      {isLoading || !settings ? (
        <LoadingState message="Loading settings…" />
      ) : (
        <SettingsForm key={settings.stipendCurrency} settings={settings} onSaved={refetch} />
      )}
    </PageContainer>
  );
};

export default Page;
