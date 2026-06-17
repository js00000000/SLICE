export interface GeoInfo {
  countryCode: string | null;
}

/**
 * Fetches the user's geolocation from the Cloudflare Edge API route (/api/geo).
 * This operation is fully fault-tolerant:
 * - It has a strict 2-second timeout to ensure it never blocks login/registration.
 * - It silently catches any errors or network failures and gracefully returns a null country.
 */
export async function fetchUserGeolocation(): Promise<GeoInfo> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 2000); // 2-second strict limit

  try {
    const response = await fetch('/api/geo', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { countryCode?: string | null };
    return {
      countryCode: data.countryCode || null,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Log a warning instead of an error to prevent noise in tracking, since this is non-critical
    console.warn('Geolocation lookup bypassed or timed out. Defaulting to null country. Details:', error);
    return { countryCode: null };
  }
}
