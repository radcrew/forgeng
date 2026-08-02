import { resolveAssetUrl } from "@lib/config";
import { cn } from "@utils";
import { initials } from "@utils/string";

interface AvatarProps {
  /** Stored avatar path or absolute URL. Falls back to initials when absent. */
  src?: string | null;
  name?: string | null;
  email: string;
  /** Rendered size in px. Defaults to 36 (list rows). */
  size?: number;
  className?: string;
}

/**
 * User avatar with an initials fallback. Avatars are uploaded through the API
 * and served from its origin, so this stays a plain `<img>` rather than
 * `next/image` — the source is dynamic and outside the build.
 */
export function Avatar({
  src,
  name = null,
  email,
  size = 36,
  className,
}: AvatarProps) {
  const dimensions = { width: size, height: size };

  if (src?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served by the API, not a static asset
      <img
        src={resolveAssetUrl(src)}
        alt=""
        style={dimensions}
        className={cn("rounded-full object-cover bg-muted shrink-0", className)}
      />
    );
  }

  return (
    <div
      style={dimensions}
      className={cn(
        "rounded-full bg-primary/10 text-primary font-semibold",
        "flex items-center justify-center shrink-0",
        className,
      )}
      // The initials duplicate the name shown beside every usage, so keep
      // them out of the accessibility tree rather than reading "JS" aloud.
      aria-hidden="true"
    >
      <span style={{ fontSize: Math.round(size * 0.36) }}>
        {initials(name, email)}
      </span>
    </div>
  );
}
