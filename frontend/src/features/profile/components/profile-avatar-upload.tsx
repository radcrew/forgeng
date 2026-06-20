"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import { ApiError } from "@lib/api-client";
import { resolveAssetUrl } from "@lib/config";
import { initials } from "@utils";
import type { UserProfile } from "@types";

import { uploadAvatar } from "../api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export type ProfileAvatarUploadProps = {
  user: UserProfile;
  onUploaded?: () => void | Promise<unknown>;
};

export const ProfileAvatarUpload = ({
  user,
  onUploaded,
}: ProfileAvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await onUploaded?.();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to upload your avatar.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
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
  );
};
