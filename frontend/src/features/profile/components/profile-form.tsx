"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FormBody, FormField } from "@components/common";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import type { UserProfile } from "@types";

import { updateProfile } from "../api";
import type { ProfileUpdate } from "../types";

export type ProfileFormProps = {
  user: UserProfile;
  /** Called after a successful save so the caller can refresh the session user. */
  onSaved?: () => void | Promise<unknown>;
};

const initials = (name: string | null, email: string) =>
  (name?.trim() || email).slice(0, 2).toUpperCase();

export const ProfileForm = ({ user, onSaved }: ProfileFormProps) => {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [githubUrl, setGithubUrl] = useState(user.githubUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // URL fields are validated as URLs server-side, so omit them when blank
    // rather than sending an empty string that would fail validation.
    const payload: ProfileUpdate = { name: name.trim(), bio: bio.trim() };
    if (githubUrl.trim()) payload.githubUrl = githubUrl.trim();
    if (avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();

    setIsSaving(true);
    try {
      await updateProfile(payload);
      toast.success("Profile saved.");
      await onSaved?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          {avatarUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied avatar URL, not a static asset
            <img
              src={avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover bg-muted"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials(user.name, user.email)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium">{user.name ?? "Unnamed"}</p>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <FormBody>
          <FormField label="Name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </FormField>
          <FormField label="Bio" htmlFor="profile-bio">
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="A short bio about you…"
            />
          </FormField>
          <FormField label="GitHub URL" htmlFor="profile-github">
            <Input
              id="profile-github"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/you"
            />
          </FormField>
          <FormField label="Avatar URL" htmlFor="profile-avatar">
            <Input
              id="profile-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…/avatar.png"
            />
          </FormField>
        </FormBody>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
