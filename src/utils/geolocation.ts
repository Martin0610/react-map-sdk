import type L from 'leaflet';
import type { LiveLocationResult } from '../types/map';

export type { LiveLocationResult };

// In-memory cache to maintain live location across component mount/unmount and tab switching
let cachedLiveLocation: LiveLocationResult | null = null;

/**
 * Returns the last known live location from memory if available.
 */
export function getCachedLocation(): LiveLocationResult | null {
  return cachedLiveLocation;
}

/**
 * Sets the last known live location in memory cache.
 */
export function setCachedLocation(loc: LiveLocationResult): void {
  cachedLiveLocation = loc;
}

/**
 * Default options for high-accuracy browser geolocation with sensible fallback timeout.
 */
const DEFAULT_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 4000,
  maximumAge: 60000
};

/**
 * Fetches the user's current location coordinates via HTML5 Geolocation API with fast IP fallback.
 * 100% free with zero API keys required.
 *
 * @param options Browser PositionOptions (enableHighAccuracy, timeout, maximumAge)
 * @returns Promise resolving to { lat, lng, accuracy, source } coordinates
 */
export function getCurrentLocation(options: PositionOptions = DEFAULT_GEO_OPTIONS): Promise<LiveLocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: LiveLocationResult = {
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
            source: 'gps'
          };
          cachedLiveLocation = result;
          resolve(result);
        },
        async (error) => {
          // If browser GPS fails, times out, or is denied, attempt free IP Geolocation fallback
          try {
            const ipCoords = await fetchIpLocation();
            if (ipCoords) {
              cachedLiveLocation = ipCoords;
              resolve(ipCoords);
              return;
            }
          } catch {
            // ignore IP fallback error and reject with original GPS error
          }
          if (cachedLiveLocation) {
            resolve(cachedLiveLocation);
            return;
          }
          reject(error);
        },
        { ...DEFAULT_GEO_OPTIONS, ...options }
      );
    } else {
      // Browser does not support geolocation, try IP fallback
      fetchIpLocation()
        .then((coords) => {
          if (coords) {
            cachedLiveLocation = coords;
            resolve(coords);
          } else if (cachedLiveLocation) {
            resolve(cachedLiveLocation);
          } else {
            reject(new Error('Geolocation is not supported by your browser or environment.'));
          }
        })
        .catch((err) => {
          if (cachedLiveLocation) resolve(cachedLiveLocation);
          else reject(err);
        });
    }
  });
}

/**
 * Helper to fetch approximate location via free public IP lookup services.
 */
async function fetchIpLocation(): Promise<LiveLocationResult | null> {
  // Provider 1: geojs.io
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          accuracy: 5000,
          source: 'ip'
        };
      }
    }
  } catch {
    // try fallback provider
  }

  // Provider 2: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          accuracy: 5000,
          source: 'ip'
        };
      }
    }
  } catch {
    // IP lookup failed
  }

  return null;
}

/**
 * Continuously watches the user's live GPS location changes.
 * Returns an unsubscribe / cleanup function to stop watching.
 *
 * @param onUpdate Callback fired on every position update with coordinates and accuracy
 * @param onError Optional error callback
 * @param options Browser PositionOptions
 * @returns Cleanup function to stop watching location
 */
export function watchLiveLocation(
  onUpdate: (coords: LiveLocationResult) => void,
  onError?: (error: GeolocationPositionError) => void,
  options: PositionOptions = DEFAULT_GEO_OPTIONS
): () => void {
  // If we already have a cached location, supply it immediately for instant visual rendering
  if (cachedLiveLocation) {
    try {
      onUpdate(cachedLiveLocation);
    } catch {
      // ignore
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    if (onError) {
      onError({
        code: 2,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
    }
    // Attempt fallback IP resolution once
    fetchIpLocation().then((coords) => {
      if (coords) {
        cachedLiveLocation = coords;
        onUpdate(coords);
      }
    }).catch(() => {});
    return () => {};
  }

  let hasReceivedGps = false;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      hasReceivedGps = true;
      const result: LiveLocationResult = {
        lat: parseFloat(position.coords.latitude.toFixed(6)),
        lng: parseFloat(position.coords.longitude.toFixed(6)),
        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : undefined,
        source: 'gps'
      };
      cachedLiveLocation = result;
      onUpdate(result);
    },
    (error) => {
      if (!hasReceivedGps && !cachedLiveLocation) {
        // Fallback to IP if GPS watch fails initially on desktop
        fetchIpLocation().then((coords) => {
          if (coords) {
            cachedLiveLocation = coords;
            onUpdate(coords);
          }
        }).catch(() => {});
      }
      if (onError) onError(error);
    },
    { ...DEFAULT_GEO_OPTIONS, ...options }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Generates an SVG string for a modern pulsing blue GPS user location dot.
 */
export function createUserLocationPinSvg(): string {
  return `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(37, 99, 235, 0.3); animation: react-map-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);"></div>
    </div>
  `.trim();
}

/**
 * Creates a Leaflet DivIcon for the user's live GPS position.
 */
export function getUserLocationDivIcon(leafletInstance: typeof L): L.DivIcon {
  return leafletInstance.divIcon({
    className: 'react-map-sdk-user-location-marker',
    html: createUserLocationPinSvg(),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}
