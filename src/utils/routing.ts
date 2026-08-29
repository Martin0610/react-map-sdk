import type { Coordinates, RouteInfo } from '../types/map';

const routeCache = new Map<string, RouteInfo>();

/**
 * Formats seconds into human-readable duration (e.g. "2 hr 45 min" or "35 min").
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
}

/**
 * Fetches turn-by-turn road geometry from the Open Source Routing Machine (OSRM).
 * Zero API keys required.
 *
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param profile Travel mode: 'driving' (default), 'walking', or 'cycling'
 * @returns RouteInfo with distance, duration, and coordinate points
 */
export async function fetchRoadRoute(
  start: Coordinates,
  end: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<RouteInfo> {
  const cacheKey = `${profile}:${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // OSRM public server provides 'driving' road trajectory
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Routing request failed with status: ${res.status}`);
    }

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No road route found between points.');
    }

    const primaryRoute = data.routes[0];
    const rawCoords: [number, number][] = primaryRoute.geometry.coordinates;

    // Convert GeoJSON [lng, lat] to Coordinates { lat, lng }
    const pathCoordinates: Coordinates[] = rawCoords.map(([lng, lat]) => ({
      lat,
      lng
    }));

    const distanceMeters = primaryRoute.distance;
    const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

    // Dynamic duration calculation based on travel profile
    let durationSeconds = primaryRoute.duration;
    if (profile === 'walking') {
      // Average walking speed: 4.8 km/h = 1.333 m/s
      durationSeconds = Math.round(distanceMeters / 1.333);
    } else if (profile === 'cycling') {
      // Average cycling speed: 16 km/h = 4.444 m/s
      durationSeconds = Math.round(distanceMeters / 4.444);
    }

    const durationMinutes = Math.round(durationSeconds / 60);
    const durationFormatted = formatDuration(durationSeconds);

    const routeInfo: RouteInfo = {
      coordinates: pathCoordinates,
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      durationFormatted,
      profile
    };

    routeCache.set(cacheKey, routeInfo);
    return routeInfo;
  } catch (err) {
    console.warn('[react-map-sdk] Failed to fetch road route from OSRM, falling back to direct line:', err);
    // Fallback: direct line between start and end
    const directDistanceMeters = calculateDirectDistance(start, end);
    const distanceKm = parseFloat((directDistanceMeters / 1000).toFixed(1));

    let durationSeconds = Math.round((distanceKm / 60) * 3600); // approx 60 km/h driving
    if (profile === 'walking') {
      durationSeconds = Math.round(directDistanceMeters / 1.333);
    } else if (profile === 'cycling') {
      durationSeconds = Math.round(directDistanceMeters / 4.444);
    }

    const fallbackRoute: RouteInfo = {
      coordinates: [start, end],
      distanceMeters: directDistanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
      durationFormatted: formatDuration(durationSeconds),
      profile,
      isFallback: true
    };

    return fallbackRoute;
  }
}

/**
 * Calculates direct great-circle distance between two coordinates using Haversine formula.
 */
export function calculateDirectDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
