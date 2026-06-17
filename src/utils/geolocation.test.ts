import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchUserGeolocation } from './geolocation';

describe('fetchUserGeolocation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Spy on console.warn to keep test output clean
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return countryCode when the API call succeeds', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ countryCode: 'TW' }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await fetchUserGeolocation();
    expect(result).toEqual({ countryCode: 'TW' });
    expect(fetch).toHaveBeenCalledWith('/api/geo', expect.any(Object));
  });

  it('should return null when the API call is not ok (e.g., status 500)', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await fetchUserGeolocation();
    expect(result).toEqual({ countryCode: null });
    expect(console.warn).toHaveBeenCalled();
  });

  it('should return null and handle errors gracefully when the fetch call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchUserGeolocation();
    expect(result).toEqual({ countryCode: null });
    expect(console.warn).toHaveBeenCalled();
  });

  it('should return null and handle timeout (aborted request) gracefully', async () => {
    // Mock fetch to reject with an AbortError, simulating what controller.abort() causes
    const abortError = new DOMException('The user aborted a request.', 'AbortError');
    vi.mocked(fetch).mockRejectedValue(abortError);

    const result = await fetchUserGeolocation();
    expect(result).toEqual({ countryCode: null });
    expect(console.warn).toHaveBeenCalled();
  });
});
