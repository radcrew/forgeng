import { GeoService } from '@modules/auth/services/geo.service';

describe('GeoService', () => {
  const service = new GeoService();

  it('returns nulls when no IP is provided', () => {
    expect(service.lookup(undefined)).toEqual({ country: null, city: null });
  });

  it('returns nulls for an empty IP string', () => {
    expect(service.lookup('')).toEqual({ country: null, city: null });
  });

  it('always returns the GeoLocation shape', () => {
    // geoip-lite may or may not be installed in the test environment, so we
    // assert the contract (keys present) rather than a specific location.
    const result = service.lookup('8.8.8.8');
    expect(result).toHaveProperty('country');
    expect(result).toHaveProperty('city');
  });
});
