// Export Main Components
export { Map } from './components/Map';
export { AddressSearch } from './components/AddressSearch';

// Export Types
export type {
  AddressDetails,
  AddressSearchProps,
  Coordinates,
  GeocodeOptions,
  GeocodeResult,
  LiveLocationResult,
  MapProps,
  ReverseGeocodeOptions,
  RouteInfo,
  TravelProfile,
  ValidationResult
} from './types/map';

// Export Utilities
export {
  isValidLatitude,
  isValidLongitude,
  validateCoordinates
} from './utils/validation';

export {
  calculateInitialCenter,
  calculateInitialZoom,
  DEFAULT_FALLBACK_CENTER,
  DEFAULT_FALLBACK_ZOOM,
  DEFAULT_SINGLE_POINT_ZOOM
} from './utils/bounds';

export {
  getStartDivIcon,
  getEndDivIcon,
  createStartPinSvg,
  createEndPinSvg
} from './utils/icons';

export {
  fetchRoadRoute,
  calculateDirectDistance,
  calculateRealisticDuration,
  interpolateGreatCircle,
  normalizeTravelProfile,
  formatDuration
} from './utils/routing';

export {
  geocodeAddress,
  reverseGeocode
} from './utils/geocoding';

export {
  getCurrentLocation,
  watchLiveLocation,
  getCachedLocation,
  setCachedLocation,
  createUserLocationPinSvg,
  getUserLocationDivIcon
} from './utils/geolocation';
