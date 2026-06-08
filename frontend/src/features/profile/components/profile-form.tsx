"use client";

import { useRef, useState } from "react";
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
import { resolveAssetUrl } from "@lib/config";
import { initials } from "@utils";
import type { UserProfile } from "@types";

import { updateProfile, uploadAvatar } from "../api";
import { PROFILE_FORM_SCHEMA, type ProfileFormValues } from "../form-schema";
import type { ProfileUpdate } from "../types";

export type ProfileFormProps = {
  user: UserProfile;
  /** Called after a successful save so the caller can refresh the session user. */
  onSaved?: () => void | Promise<unknown>;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

// The URL/handle fields are validated server-side and only sent when filled, so
// a blank field clears rather than fails. These map form keys to payload keys.
const OPTIONAL_FIELDS = [
  "linkedin",
  "twitter",
  "facebook",
  "github",
  "portfolio",
  "telegram",
  "whatsapp",
] as const;

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

  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image is too large. The maximum size is 2 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl ?? "");
      toast.success("Avatar updated.");
      await onSaved?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to upload your avatar.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          {avatarUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element -- user avatar served by the API, not a static asset
            <img
              src={resolveAssetUrl(avatarUrl)}
              alt=""
              className="h-16 w-16 rounded-full object-cover bg-muted"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials(user.name, user.email)}
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <div className="min-w-0">
              <p className="font-medium">{user.name ?? "Unnamed"}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading
                  ? "Uploading…"
                  : avatarUrl.trim()
                    ? "Change photo"
                    : "Upload photo"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG, or WebP. Max 2 MB.
              </p>
            </div>
          </div>
        </div>

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
            <FormField
              control={form.control}
              name="github"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/you" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/you" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X (Twitter)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://x.com/you" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/you" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telegram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourusername" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormDescription>
                    Include country code, e.g. +1234567890
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portfolio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yoursite.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    If you don&apos;t have a portfolio website yet, you can leave
                    this blank — your profile can still be considered complete.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
