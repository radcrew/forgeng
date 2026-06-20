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
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import type { UserProfile } from "@types";

import { updateProfile } from "../api";
import { PROFILE_FORM_SCHEMA, type ProfileFormValues } from "../form-schema";
import type { ProfileUpdate } from "../types";
import { ProfileAvatarUpload } from "./profile-avatar-upload";

export type ProfileFormProps = {
  user: UserProfile;
  onSaved?: () => void | Promise<unknown>;
};

const OPTIONAL_FIELDS = [
  "linkedin",
  "twitter",
  "facebook",
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
  { name: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/you" },
  { name: "twitter", label: "X (Twitter)", placeholder: "https://x.com/you" },
  { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/you" },
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

export const ProfileForm = ({ user, onSaved }: ProfileFormProps) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(PROFILE_FORM_SCHEMA),
    defaultValues: {
      name: user.name ?? "",
      bio: user.bio ?? "",
      linkedin: user.linkedin ?? "",
      twitter: user.twitter ?? "",
      facebook: user.facebook ?? "",
      github: user.github ?? "",
      portfolio: user.portfolio ?? "",
      telegram: user.telegram ?? "",
      whatsapp: user.whatsapp ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: user.name ?? "",
      bio: user.bio ?? "",
      linkedin: user.linkedin ?? "",
      twitter: user.twitter ?? "",
      facebook: user.facebook ?? "",
      github: user.github ?? "",
      portfolio: user.portfolio ?? "",
      telegram: user.telegram ?? "",
      whatsapp: user.whatsapp ?? "",
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: ProfileFormValues) => {
    const payload: ProfileUpdate = {
      name: data.name.trim(),
      bio: data.bio.trim(),
    };
    for (const field of OPTIONAL_FIELDS) {
      const value = data[field].trim();
      if (value) payload[field] = value;
    }
    try {
      await updateProfile(payload);
      toast.success("Profile saved.");
      await onSaved?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save your profile.",
      );
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
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="A short bio about you…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {SOCIAL_FIELDS.map((sf) => (
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
