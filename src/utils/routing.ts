import type { Coordinates, RouteInfo, TravelProfile } from '../types/map';

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
 * Normalizes travel profile alias into standard 'car' | 'bike' | 'walking'.
 */
export function normalizeTravelProfile(
  profile: TravelProfile = 'car'
): 'car' | 'bike' | 'walking' {
  if (profile === 'car' || profile === 'driving') return 'car';
  if (profile === 'bike' || profile === 'cycling') return 'bike';
  return 'walking';
}

/**
 * Calculates a realistic ETA duration in seconds considering real-world road traffic,
 * traffic signals, urban speed limits, and travel profiles.
 */
export function calculateRealisticDuration(
  distanceKm: number,
  distanceMeters: number,
  profile: 'car' | 'bike' | 'walking',
  osrmRawDuration?: number
): number {
  if (profile === 'walking') {
    // Average realistic walking speed: 4.5 km/h = 1.25 m/s
    return Math.round(distanceMeters / 1.25);
  }
  if (profile === 'bike') {
    // Average realistic cycling speed: 15 km/h = 4.16 m/s
    return Math.round(distanceMeters / 4.16);
  }

  // Realistic Driving Speed Model (accounts for urban traffic, signals, road conditions):
  // - City / Short distance (<= 10 km): ~28 km/h average
  // - Suburban / Medium distance (10 - 35 km): ~38 km/h average (e.g. 30 km = ~47 min)
  // - Regional / Intercity (35 - 100 km): ~50 km/h average
  // - Long-distance Highway (> 100 km): ~65 km/h average
  let avgSpeedKmh: number;
  if (distanceKm <= 10) {
    avgSpeedKmh = 28;
  } else if (distanceKm <= 35) {
    avgSpeedKmh = 38;
  } else if (distanceKm <= 100) {
    avgSpeedKmh = 50;
  } else {
    avgSpeedKmh = 65;
  }

  const modelDuration = Math.round((distanceKm / avgSpeedKmh) * 3600);

  // If OSRM raw duration is available, blend it with realistic traffic weighting
  if (osrmRawDuration && osrmRawDuration > 0) {
    const osrmSpeed = distanceKm / (osrmRawDuration / 3600);
    // If OSRM assumed free-flow unadjusted speed, scale realistically
    if (osrmSpeed > avgSpeedKmh) {
      return Math.round(Math.max(osrmRawDuration * 1.5, modelDuration));
    }
    return Math.round(Math.max(osrmRawDuration * 1.15, modelDuration * 0.9));
  }

  return modelDuration;
}

/**
 * Fetches turn-by-turn road geometry tailored to the travel profile (Car, Bike, Walking).
 * 100% free with zero API keys required.
 *
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @param profile Travel mode: 'car' (default), 'bike', or 'walking'
 * @returns RouteInfo with profile-specific trajectory, distance, and duration
 */
export async function fetchRoadRoute(
  start: Coordinates,
  end: Coordinates,
  profile: TravelProfile = 'car'
): Promise<RouteInfo> {
  const normProfile = normalizeTravelProfile(profile);
  const cacheKey = `${normProfile}:${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Profile-specific free OSM routing endpoints
  const endpointMap = {
    car: [
      `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`,
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    ],
    bike: [
      `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`,
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    ],
    walking: [
      `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`,
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    ]
  };

  const urlsToTry = endpointMap[normProfile];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s fast timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) continue;

      const primaryRoute = data.routes[0];
      const rawCoords: [number, number][] = primaryRoute.geometry.coordinates;

      if (!rawCoords || rawCoords.length === 0) continue;

      // Convert GeoJSON [lng, lat] to Coordinates { lat, lng }
      const pathCoordinates: Coordinates[] = rawCoords.map(([lng, lat]) => ({
        lat,
        lng
      }));

      const firstCoord = pathCoordinates[0];
      const lastCoord = pathCoordinates[pathCoordinates.length - 1];

      const startDistToRoad = calculateDirectDistance(start, firstCoord);
      const endDistToRoad = calculateDirectDistance(end, lastCoord);

      // If destination is more than 35km from road network (e.g. cross-ocean snapped to wrong continent), reject
      if (endDistToRoad > 35000 || startDistToRoad > 35000) {
        throw new Error(
          `Route does not reach destination (endpoint is ${Math.round(endDistToRoad / 1000)} km away).`
        );
      }

      // Connect gaps: prepend start and append end coordinates so line touches pins seamlessly
      if (firstCoord.lat !== start.lat || firstCoord.lng !== start.lng) {
        pathCoordinates.unshift(start);
      }
      if (lastCoord.lat !== end.lat || lastCoord.lng !== end.lng) {
        pathCoordinates.push(end);
      }

      const distanceMeters = primaryRoute.distance + startDistToRoad + endDistToRoad;
      const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

      // Calculate realistic ETA duration
      const durationSeconds = calculateRealisticDuration(
        distanceKm,
        distanceMeters,
        normProfile,
        primaryRoute.duration
      );

      const durationMinutes = Math.round(durationSeconds / 60);
      const durationFormatted = formatDuration(durationSeconds);

      const routeInfo: RouteInfo = {
        coordinates: pathCoordinates,
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        durationFormatted,
        profile: normProfile
      };

      routeCache.set(cacheKey, routeInfo);
      return routeInfo;
    } catch {
      // Continue to next endpoint fallback
      continue;
    }
  }

  // Fallback: smooth geodesic great-circle flight path between start and end
  console.warn(`[react-map-sdk] Routing unroutable for ${normProfile}, falling back to geodesic line.`);
  const directDistanceMeters = calculateDirectDistance(start, end);
  const distanceKm = parseFloat((directDistanceMeters / 1000).toFixed(1));

  const durationSeconds = calculateRealisticDuration(
    distanceKm,
    directDistanceMeters,
    normProfile
  );

  const geodesicCoordinates = interpolateGreatCircle(start, end, 64);

  const fallbackRoute: RouteInfo = {
    coordinates: geodesicCoordinates,
    distanceMeters: directDistanceMeters,
    distanceKm,
    durationSeconds,
    durationMinutes: Math.round(durationSeconds / 60),
    durationFormatted: formatDuration(durationSeconds),
    profile: normProfile,
    isFallback: true
  };

  routeCache.set(cacheKey, fallbackRoute);
  return fallbackRoute;
}

/**
 * Generates smooth Great-Circle (geodesic) path coordinates between two locations.
 */
export function interpolateGreatCircle(
  start: Coordinates,
  end: Coordinates,
  numPoints = 64
): Coordinates[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(start.lat);
  const lon1 = toRad(start.lng);
  const lat2 = toRad(end.lat);
  const lon2 = toRad(end.lng);

  // Cartesian coordinates on unit sphere
  const v1 = [
    Math.cos(lat1) * Math.cos(lon1),
    Math.cos(lat1) * Math.sin(lon1),
    Math.sin(lat1)
  ];
  const v2 = [
    Math.cos(lat2) * Math.cos(lon2),
    Math.cos(lat2) * Math.sin(lon2),
    Math.sin(lat2)
  ];

  const dot = Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]));
  const omega = Math.acos(dot);

  if (omega < 1e-6 || isNaN(omega)) {
    return [start, end];
  }

  const sinOmega = Math.sin(omega);
  const points: Coordinates[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const a = Math.sin((1 - f) * omega) / sinOmega;
    const b = Math.sin(f * omega) / sinOmega;

    const x = a * v1[0] + b * v2[0];
    const y = a * v1[1] + b * v2[1];
    const z = a * v1[2] + b * v2[2];

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));

    points.push({ lat, lng });
  }

  return points;
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
