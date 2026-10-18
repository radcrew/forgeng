"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { ApiError } from "@lib/api-client";
import type { UserProfile } from "@types";

import { updateProfile } from "../api";
import { PROFILE_FORM_SCHEMA, type ProfileFormValues } from "../form-schema";
import type { ProfileUpdate } from "../types";
import { ProfileAvatarUpload } from "./profile-avatar-upload";

export type ProfileFormProps = {
  user: UserProfile;
  onSaved?: () => void | Promise<unknown>;
  /**
   * False when the student has no application, so links can't be saved.
   * Undefined while it is unknown; the link fields then show as usual.
   */
  hasApplication?: boolean;
};

const OPTIONAL_FIELDS = [
  "linkedin",
  "twitter",
  "github",
  "portfolio",
  "telegram",
  "whatsapp",
] as const;

type SocialFieldConfig = {
  name: keyof ProfileFormValues;
  label: string;
  placeholder: string;
  description?: string;
};

const SOCIAL_FIELDS: SocialFieldConfig[] = [
  { name: "github", label: "GitHub", placeholder: "https://github.com/you" },
  {
    name: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/you",
  },
  { name: "twitter", label: "X (Twitter)", placeholder: "https://x.com/you" },
  { name: "telegram", label: "Telegram", placeholder: "@yourusername" },
  {
    name: "whatsapp",
    label: "WhatsApp",
    placeholder: "+1234567890",
    description: "Include country code, e.g. +1234567890",
  },
  {
    name: "portfolio",
    label: "Portfolio",
    placeholder: "https://yoursite.com",
    description:
      "If you don't have a portfolio website yet, you can leave this blank — your profile can still be considered complete.",
  },
];

export const ProfileForm = ({
  user,
  onSaved,
  hasApplication,
}: ProfileFormProps) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(PROFILE_FORM_SCHEMA),
    defaultValues: {
      name: user.name ?? "",
      linkedin: user.linkedin ?? "",
      twitter: user.twitter ?? "",
      github: user.github ?? "",
      portfolio: user.portfolio ?? "",
      telegram: user.telegram ?? "",
      whatsapp: user.whatsapp ?? "",
    },
  });

  useEffect(() => {
    form.reset(
      {
        name: user.name ?? "",
        linkedin: user.linkedin ?? "",
        twitter: user.twitter ?? "",
        github: user.github ?? "",
        portfolio: user.portfolio ?? "",
        telegram: user.telegram ?? "",
        whatsapp: user.whatsapp ?? "",
      },
      // A reload (a photo upload, another tab) keeps what the student typed
      // but hasn't saved yet, and updates only the fields they didn't touch.
      { keepDirtyValues: true },
    );
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: ProfileFormValues) => {
    const payload: ProfileUpdate = {
      name: data.name.trim(),
    };
    for (const field of hasApplication === false ? [] : OPTIONAL_FIELDS) {
      const value = data[field].trim();
      if (value) {
        payload[field] = value;
      } else if (user[field]) {
        // The student emptied a saved field. Send null so the server removes
        // it; leaving it out would keep the old value.
        payload[field] = null;
      }
    }
    try {
      await updateProfile(payload);
      toast.success("Profile saved.");
      // Show exactly what was saved. Nothing is unsaved now, so the reload
      // that follows can update every field.
      form.reset({
        name: payload.name ?? "",
        linkedin: payload.linkedin ?? "",
        twitter: payload.twitter ?? "",
        github: payload.github ?? "",
        portfolio: payload.portfolio ?? "",
        telegram: payload.telegram ?? "",
        whatsapp: payload.whatsapp ?? "",
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save your profile.",
      );
      return;
    }
    // Outside the try above: the save worked, so a failed reload must not
    // show "Failed to save" next to "Profile saved". The form already shows
    // the saved values.
    try {
      await onSaved?.();
    } catch {
      // The next reload catches up.
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <ProfileAvatarUpload user={user} onUploaded={onSaved} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Links are saved with the application, so without one the
                server refuses them. Say so instead of showing fields that
                can only fail. */}
            {hasApplication === false && (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Your profile links are saved with your application. Apply to
                the program to add your GitHub, LinkedIn and contact links.
              </p>
            )}

            {hasApplication !== false && SOCIAL_FIELDS.map((sf) => (
              <FormField
                key={sf.name}
                control={form.control}
                name={sf.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{sf.label}</FormLabel>
                    <FormControl>
                      <Input placeholder={sf.placeholder} {...field} />
                    </FormControl>
                    {sf.description && (
                      <FormDescription>{sf.description}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
