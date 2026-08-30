import type L from 'leaflet';
import type { Coordinates } from '../types/map';

/**
 * Default options for high-accuracy browser geolocation.
 */
const DEFAULT_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

/**
 * Fetches the user's current GPS location coordinates via HTML5 Geolocation API.
 * 100% free with zero API keys required.
 *
 * @param options Browser PositionOptions (enableHighAccuracy, timeout, maximumAge)
 * @returns Promise resolving to { lat, lng } coordinates
 */
export function getCurrentLocation(options: PositionOptions = DEFAULT_GEO_OPTIONS): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or environment.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: parseFloat(position.coords.latitude.toFixed(6)),
          lng: parseFloat(position.coords.longitude.toFixed(6))
        });
      },
      (error) => {
        reject(error);
      },
      { ...DEFAULT_GEO_OPTIONS, ...options }
    );
  });
}

/**
 * Continuously watches the user's live GPS location changes.
 * Returns an unsubscribe / cleanup function to stop watching.
 *
 * @param onUpdate Callback fired on every position update
 * @param onError Optional error callback
 * @param options Browser PositionOptions
 * @returns Cleanup function to stop watching location
 */
export function watchLiveLocation(
  onUpdate: (coords: Coordinates) => void,
  onError?: (error: GeolocationPositionError) => void,
  options: PositionOptions = DEFAULT_GEO_OPTIONS
): () => void {
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
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        lat: parseFloat(position.coords.latitude.toFixed(6)),
        lng: parseFloat(position.coords.longitude.toFixed(6))
      });
    },
    (error) => {
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
      <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: react-map-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
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
    iconAnchor: [12, 12]
  });
}
