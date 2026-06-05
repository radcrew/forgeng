import { Injectable } from '@nestjs/common';

export interface GeoLocation {
  country: string | null;
  city: string | null;
}

// Inline type for geoip-lite so the service compiles whether or not the
// package is installed. Install with: pnpm --filter backend add geoip-lite
type GeoLite = {
  lookup: (ip: string) => { country?: string; city?: string } | null;
};

let geoip: GeoLite | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  geoip = require('geoip-lite') as GeoLite;
} catch {
  // Package not yet installed — lookups will return null until it is.
}

@Injectable()
export class GeoService {
  lookup(rawIp: string | undefined): GeoLocation {
    if (!rawIp || !geoip) return { country: null, city: null };

    // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4 → 1.2.3.4).
    const ip = rawIp.replace(/^::ffff:/, '');
    const geo = geoip.lookup(ip);

    return {
      country: geo?.country ?? null,
      city: geo?.city ?? null,
    };
  }
}
