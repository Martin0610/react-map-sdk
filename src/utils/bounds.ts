import type { Coordinates } from '../types/map';
import { validateCoordinates } from './validation';

/**
 * Sensible default fallback center (equator / prime meridian overview)
 */
export const DEFAULT_FALLBACK_CENTER: Coordinates = {
  lat: 20.0,
  lng: 0.0
};

export const DEFAULT_FALLBACK_ZOOM = 2;
export const DEFAULT_SINGLE_POINT_ZOOM = 13;

/**
 * Calculates a sensible initial center based on available props.
 */
export function calculateInitialCenter(options: {
  center?: Coordinates;
  start?: Coordinates;
  end?: Coordinates;
}): Coordinates {
  const { center, start, end } = options;

  if (center && validateCoordinates(center, 'center').isValid) {
    return center;
  }

  const startValid = start && validateCoordinates(start, 'start').isValid;
  const endValid = end && validateCoordinates(end, 'end').isValid;

  if (startValid && endValid && start && end) {
    return {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2
    };
  }

  if (startValid && start) {
    return start;
  }

  if (endValid && end) {
    return end;
  }

  return DEFAULT_FALLBACK_CENTER;
}

/**
 * Calculates initial zoom level based on props.
 */
export function calculateInitialZoom(options: {
  zoom?: number;
  center?: Coordinates;
  start?: Coordinates;
  end?: Coordinates;
}): number {
  if (typeof options.zoom === 'number' && !Number.isNaN(options.zoom)) {
    return options.zoom;
  }

  const hasCenter = Boolean(options.center && validateCoordinates(options.center).isValid);
  const hasStart = Boolean(options.start && validateCoordinates(options.start).isValid);
  const hasEnd = Boolean(options.end && validateCoordinates(options.end).isValid);

  if (hasCenter || (hasStart && !hasEnd) || (!hasStart && hasEnd)) {
    return DEFAULT_SINGLE_POINT_ZOOM;
  }

  if (hasStart && hasEnd) {
    return 10;
  }

  return DEFAULT_FALLBACK_ZOOM;
}
