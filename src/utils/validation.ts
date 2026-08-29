import type { Coordinates, ValidationResult } from '../types/map';

/**
 * Validates whether a latitude value is within the acceptable range (-90 to 90).
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !Number.isNaN(lat) && Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates whether a longitude value is within the acceptable range (-180 to 180).
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !Number.isNaN(lng) && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates a Coordinates object.
 *
 * @param coords The Coordinates to validate
 * @param label Optional name identifier for developer error messages
 * @returns ValidationResult with isValid status and error message if invalid
 */
export function validateCoordinates(
  coords?: Coordinates | null,
  label: string = 'Coordinates'
): ValidationResult {
  if (!coords) {
    return { isValid: false, error: `${label} was not provided.` };
  }

  if (typeof coords.lat !== 'number' || Number.isNaN(coords.lat)) {
    return {
      isValid: false,
      error: `Invalid ${label} latitude: "${coords.lat}". Latitude must be a valid number between -90 and 90.`
    };
  }

  if (!isValidLatitude(coords.lat)) {
    return {
      isValid: false,
      error: `Invalid ${label} latitude: ${coords.lat}. Latitude must be between -90 and 90.`
    };
  }

  if (typeof coords.lng !== 'number' || Number.isNaN(coords.lng)) {
    return {
      isValid: false,
      error: `Invalid ${label} longitude: "${coords.lng}". Longitude must be a valid number between -180 and 180.`
    };
  }

  if (!isValidLongitude(coords.lng)) {
    return {
      isValid: false,
      error: `Invalid ${label} longitude: ${coords.lng}. Longitude must be between -180 and 180.`
    };
  }

  return { isValid: true };
}
