"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { FormBody, FormField } from "@components/common";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { ApiError } from "@lib/api-client";
import { resolveAssetUrl } from "@lib/config";
import { initials } from "@utils";
import type { UserProfile } from "@types";

import { updateProfile, uploadAvatar } from "../api";
import type { ProfileUpdate } from "../types";

export type ProfileFormProps = {
  user: UserProfile;
  /** Called after a successful save so the caller can refresh the session user. */
  onSaved?: () => void | Promise<unknown>;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export const ProfileForm = ({ user, onSaved }: ProfileFormProps) => {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [linkedin, setLinkedin] = useState(user.linkedin ?? "");
  const [twitter, setTwitter] = useState(user.twitter ?? "");
  const [facebook, setFacebook] = useState(user.facebook ?? "");
  const [github, setGithub] = useState(user.github ?? "");
  const [portfolio, setPortfolio] = useState(user.portfolio ?? "");
  const [telegram, setTelegram] = useState(user.telegram ?? "");
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    // URL fields are validated as URLs server-side, so omit them when blank
    // rather than sending an empty string that would fail validation.
    const payload: ProfileUpdate = { name: name.trim(), bio: bio.trim() };
    if (linkedin.trim()) payload.linkedin = linkedin.trim();
    if (twitter.trim()) payload.twitter = twitter.trim();
    if (facebook.trim()) payload.facebook = facebook.trim();
    if (github.trim()) payload.github = github.trim();
    if (portfolio.trim()) payload.portfolio = portfolio.trim();
    if (telegram.trim()) payload.telegram = telegram.trim();
    if (whatsapp.trim()) payload.whatsapp = whatsapp.trim();

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
          <FormField label="GitHub" htmlFor="profile-github">
            <Input
              id="profile-github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/you"
            />
          </FormField>
          <FormField label="LinkedIn" htmlFor="profile-linkedin">
            <Input
              id="profile-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
          </FormField>
          <FormField label="X (Twitter)" htmlFor="profile-twitter">
            <Input
              id="profile-twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/you"
            />
          </FormField>
          <FormField label="Facebook" htmlFor="profile-facebook">
            <Input
              id="profile-facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/you"
            />
          </FormField>
          <FormField label="Telegram" htmlFor="profile-telegram">
            <Input
              id="profile-telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@yourusername"
            />
          </FormField>
          <FormField label="WhatsApp" htmlFor="profile-whatsapp">
            <Input
              id="profile-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Include country code, e.g. +1234567890
            </p>
          </FormField>
          <FormField label="Portfolio" htmlFor="profile-portfolio">
            <Input
              id="profile-portfolio"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://yoursite.com"
            />
            <p className="text-xs text-muted-foreground">
              If you don&apos;t have a portfolio website yet, you can leave this
              blank — your profile can still be considered complete.
            </p>
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
