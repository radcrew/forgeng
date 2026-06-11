import { Injectable } from '@nestjs/common';

import { IpReputationService } from './ip-reputation.service';

/** ISO 3166-1 alpha-2 codes the service is currently available in. */
const ALLOWED_COUNTRY_CODES = new Set(['US', 'CA']);

export type AccessRestriction = 'region' | 'vpn';

@Injectable()
export class RegionRestrictionService {
  constructor(private readonly ipReputation: IpReputationService) {}

  /**
   * Returns the reason access should be blocked for this IP, or null if
   * access is allowed. Fails open (returns null) when the country/VPN
   * status can't be determined.
   */
  async check(ip: string | undefined): Promise<AccessRestriction | null> {
    const { countryCode, isVpn } = await this.ipReputation.lookup(ip);

    if (isVpn) return 'vpn';
    if (countryCode && !ALLOWED_COUNTRY_CODES.has(countryCode)) return 'region';
    return null;
  }
}
