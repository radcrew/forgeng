/**
 * Guard for rendering user-supplied URLs as anchor hrefs: only http(s) may
 * link out (blocks javascript: and other schemes the backend might let through).
 */
export const isSafeHref = (href: string): boolean => /^https?:\/\//i.test(href);

/** A chat link for a saved Telegram handle (@name or a t.me URL), or null. */
export const telegramHref = (value: string): string | null => {
  const handle = value.trim().match(/^@([A-Za-z][A-Za-z0-9_]{4,31})$/)?.[1];
  if (handle) return `https://t.me/${handle}`;
  return /^https?:\/\/t\.me\/[A-Za-z][A-Za-z0-9_]{4,31}\/?$/i.test(value.trim())
    ? value.trim()
    : null;
};

/** A chat link for a saved WhatsApp number in +E.164 form, or null. */
export const whatsappHref = (value: string): string | null => {
  const digits = value.trim().match(/^\+([1-9]\d{6,14})$/)?.[1];
  return digits ? `https://wa.me/${digits}` : null;
};
