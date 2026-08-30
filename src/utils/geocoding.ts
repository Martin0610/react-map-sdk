import type {
  Coordinates,
  GeocodeOptions,
  GeocodeResult,
  ReverseGeocodeOptions
} from '../types/map';
import { validateCoordinates } from './validation';

const geocodeCache = new Map<string, GeocodeResult[]>();
const reverseGeocodeCache = new Map<string, GeocodeResult>();

const NOMINATIM_SEARCH_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimRawResult {
  place_id?: number;
  licence?: string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: Record<string, string>;
}

/**
 * Searches for a location by street address, city, landmark, or postal code.
 * 100% free with zero API keys required (powered by OpenStreetMap Nominatim).
 *
 * @param query Address, place name, or city to search for
 * @param options Custom search options (limit, countryCodes, language, customEndpoint)
 * @returns Array of matching GeocodeResults with coordinates and address details
 */
export async function geocodeAddress(
  query: string,
  options: GeocodeOptions = {}
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const {
    limit = 5,
    language = 'en',
    countryCodes,
    customEndpoint = NOMINATIM_SEARCH_ENDPOINT
  } = options;

  const countryFilter = countryCodes && countryCodes.length > 0 ? countryCodes.join(',').toLowerCase() : '';
  const cacheKey = `geo:${customEndpoint}:${language}:${countryFilter}:${limit}:${trimmed.toLowerCase()}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const urlParams = new URLSearchParams({
    format: 'json',
    q: trimmed,
    addressdetails: '1',
    limit: String(limit),
    'accept-language': language
  });

  if (countryFilter) {
    urlParams.set('countrycodes', countryFilter);
  }

  const url = `${customEndpoint}?${urlParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Geocoding request failed with status: ${res.status}`);
    }

    const rawList: NominatimRawResult[] = await res.json();

    if (!Array.isArray(rawList)) {
      return [];
    }

    const results: GeocodeResult[] = rawList
      .map((item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (isNaN(lat) || isNaN(lng)) return null;

        const boundingBox: [number, number, number, number] | undefined =
          item.boundingbox && item.boundingbox.length === 4
            ? [
                parseFloat(item.boundingbox[0]),
                parseFloat(item.boundingbox[1]),
                parseFloat(item.boundingbox[2]),
                parseFloat(item.boundingbox[3])
              ]
            : undefined;

        const result: GeocodeResult = {
          displayName: item.display_name,
          coordinates: { lat, lng },
          name: item.name || item.display_name.split(',')[0].trim(),
          addressDetails: item.address,
          boundingBox,
          type: item.type,
          importance: item.importance
        };

        return result;
      })
      .filter((r): r is GeocodeResult => r !== null);

    geocodeCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.warn(`[react-map-sdk] Failed to geocode address "${query}":`, err);
    return [];
  }
}

/**
 * Converts geographical coordinates (latitude & longitude) into a readable street address.
 * 100% free with zero API keys required (powered by OpenStreetMap Nominatim).
 *
 * @param coords Geographic coordinates { lat, lng }
 * @param options Custom reverse options (language, zoom, customEndpoint)
 * @returns GeocodeResult with formatted address details, or null if lookup fails
 */
export async function reverseGeocode(
  coords: Coordinates,
  options: ReverseGeocodeOptions = {}
): Promise<GeocodeResult | null> {
  const validation = validateCoordinates(coords, 'reverseGeocode');
  if (!validation.isValid) {
    console.warn(`[react-map-sdk] Invalid coordinates provided to reverseGeocode:`, validation.error);
    return null;
  }

  const {
    language = 'en',
    zoom = 18,
    customEndpoint = NOMINATIM_REVERSE_ENDPOINT
  } = options;

  const latKey = coords.lat.toFixed(5);
  const lngKey = coords.lng.toFixed(5);
  const cacheKey = `rev:${customEndpoint}:${language}:${zoom}:${latKey},${lngKey}`;

  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  const urlParams = new URLSearchParams({
    format: 'json',
    lat: String(coords.lat),
    lon: String(coords.lng),
    addressdetails: '1',
    zoom: String(zoom),
    'accept-language': language
  });

  const url = `${customEndpoint}?${urlParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Reverse geocoding request failed with status: ${res.status}`);
    }

    const item: NominatimRawResult = await res.json();

    if (!item || !item.lat || !item.lon) {
      return null;
    }

    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    const boundingBox: [number, number, number, number] | undefined =
      item.boundingbox && item.boundingbox.length === 4
        ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3])
          ]
        : undefined;

    const result: GeocodeResult = {
      displayName: item.display_name,
      coordinates: { lat, lng },
      name: item.name || item.display_name.split(',')[0].trim(),
      addressDetails: item.address,
      boundingBox,
      type: item.type,
      importance: item.importance
    };

    reverseGeocodeCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`[react-map-sdk] Failed to reverse geocode coordinates (${coords.lat}, ${coords.lng}):`, err);
    return null;
  }
}
