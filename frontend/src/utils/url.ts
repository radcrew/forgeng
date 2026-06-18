/**
 * Guard for rendering user-supplied URLs as anchor hrefs: only http(s) may
 * link out (blocks javascript: and other schemes the backend might let through).
 */
export const isSafeHref = (href: string): boolean => /^https?:\/\//i.test(href);
