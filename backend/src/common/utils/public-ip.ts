const LOOKUP_URL = 'https://api.ipify.org';
const LOOKUP_TIMEOUT_MS = 3000;
const LOCAL_IP = '127.0.0.1';

/** True for this machine's own address (IPv4, IPv6 or IPv4-mapped IPv6). */
export function isLoopbackIp(ip: string): boolean {
  const v4 = ip.replace(/^::ffff:/, '');
  return v4 === '::1' || v4.startsWith('127.');
}

/**
 * The IP to record for a new account. A request from this machine (local
 * development) carries 127.0.0.1, so ask a public service for the machine's
 * public IP instead. Offline or on failure, keep 127.0.0.1.
 */
export async function resolveRegistrationIp(
  ip: string | undefined,
): Promise<string | undefined> {
  if (!ip || !isLoopbackIp(ip)) return ip;
  try {
    const res = await fetch(LOOKUP_URL, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!res.ok) return LOCAL_IP;
    const publicIp = (await res.text()).trim();
    // Only accept something shaped like an IP address.
    return /^[0-9a-f.:]{3,45}$/i.test(publicIp) ? publicIp : LOCAL_IP;
  } catch {
    return LOCAL_IP;
  }
}
