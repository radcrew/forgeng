/** Split a display name into first / last, falling back to the email handle. */
export function splitName(
  name: string | null,
  email: string,
): { firstName: string; lastName: string } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: email.split('@')[0] || email, lastName: '' };
  }
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') };
}
