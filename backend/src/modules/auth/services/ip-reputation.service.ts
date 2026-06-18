import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfiguration } from '@config';

export interface IpReputationResult {
  countryCode: string | null;
  isVpn: boolean;
}

const REQUEST_TIMEOUT_MS = 3000;

interface IpqsResponse {
  success?: boolean;
  country_code?: string;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
}

const EMPTY_RESULT: IpReputationResult = { countryCode: null, isVpn: false };

@Injectable()
export class IpReputationService {
  private readonly logger = new Logger(IpReputationService.name);

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {}

  /**
   * Looks up the country and VPN/proxy/Tor status for an IP via IPQualityScore.
   * Returns an empty (non-blocking) result if no API key is configured, the IP
   * is missing, or the lookup fails — callers should fail open in that case.
   */
  async lookup(rawIp: string | undefined): Promise<IpReputationResult> {
    const apiKey = this.config.get('ipQualityScore.apiKey', { infer: true });
    if (!apiKey || !rawIp) return EMPTY_RESULT;

    // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4 → 1.2.3.4).
    const ip = rawIp.replace(/^::ffff:/, '');

    try {
      const url = `https://ipqualityscore.com/api/json/ip/${apiKey}/${encodeURIComponent(ip)}?strictness=1`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) return EMPTY_RESULT;

      const data = (await res.json()) as IpqsResponse;
      if (data.success === false) return EMPTY_RESULT;

      return {
        countryCode: data.country_code ?? null,
        isVpn: Boolean(data.vpn || data.proxy || data.tor),
      };
    } catch (err) {
      this.logger.warn(
        `IP reputation lookup failed: ${(err as Error).message}`,
      );
      return EMPTY_RESULT;
    }
  }
}
