import type { CSSProperties } from 'react';

/**
 * Geographic coordinates representing latitude and longitude.
 */
export interface Coordinates {
  /**
   * Latitude in decimal degrees (must be between -90 and 90).
   */
  lat: number;
  /**
   * Longitude in decimal degrees (must be between -180 and 180).
   */
  lng: number;
}

/**
 * Live geolocation result with accuracy and source details.
 */
export interface LiveLocationResult extends Coordinates {
  /**
   * Accuracy radius in meters (from HTML5 Geolocation or IP fallback).
   */
  accuracy?: number;
  /**
   * Geolocation source ('gps' or 'ip').
   */
  source?: 'gps' | 'ip';
}

/**
 * Supported travel modes for road routing.
 */
export type TravelProfile = 'driving' | 'car' | 'bike' | 'cycling' | 'walking';

/**
 * Calculated route information containing road trajectory, distance, and duration.
 */
export interface RouteInfo {
  /**
   * Array of coordinates tracing the real road path.
   */
  coordinates: Coordinates[];
  /**
   * Total road distance in meters.
   */
  distanceMeters: number;
  /**
   * Total road distance in kilometers.
   */
  distanceKm: number;
  /**
   * Estimated duration in seconds.
   */
  durationSeconds: number;
  /**
   * Estimated duration in minutes.
   */
  durationMinutes: number;
  /**
   * Human-readable duration string (e.g. "2 hr 45 min" or "35 min").
   */
  durationFormatted: string;
  /**
   * Travel profile used ('car' / 'driving', 'bike' / 'cycling', 'walking').
   */
  profile: TravelProfile;
  /**
   * Whether this route fell back to a direct line due to network/road unavailability.
   */
  isFallback?: boolean;
}

/**
 * Props for the Map component.
 */
export interface MapProps {
  /**
   * Initial center coordinates of the map.
   * If omitted, the center will be automatically derived from the start/end points,
   * or fallback to a sensible default.
   */
  center?: Coordinates;

  /**
   * Initial zoom level of the map.
   * Default is 13 when a single point/center is provided, or 2 for a global view.
   */
  zoom?: number;

  /**
   * Starting point coordinates.
   * Renders a clearly distinguished Start marker on the map.
   */
  start?: Coordinates;

  /**
   * Optional custom name or label for the Starting point (e.g. "Vellore Fort").
   * Displayed on the map marker popup and tooltip.
   */
  startName?: string;

  /**
   * Ending point coordinates.
   * Renders a clearly distinguished End marker on the map.
   */
  end?: Coordinates;

  /**
   * Optional custom name or label for the Ending point (e.g. "Chennai Central").
   * Displayed on the map marker popup and tooltip.
   */
  endName?: string;

  /**
   * Whether to calculate and display real Google Maps-style turn-by-turn road routing
   * between the start and end points using OSRM (100% free, zero API keys required).
   * Default: true when both start and end coordinates are provided.
   */
  routing?: boolean;

  /**
   * Travel profile for road routing: 'car' / 'driving' (default), 'bike' / 'cycling', or 'walking'.
   * Default: 'car'
   */
  routingProfile?: TravelProfile;

  /**
   * Primary color of the road route polyline (Google Maps blue by default).
   * Default: "#3b82f6"
   */
  routeColor?: string;

  /**
   * Stroke width in pixels of the road route polyline.
   * Default: 5
   */
  routeWeight?: number;

  /**
   * Whether to display a direct connecting straight line between the start and end points
   * (only used if routing={false} or as fallback).
   * Default: true
   */
  showLine?: boolean;

  /**
   * Color of the straight connecting line (when routing is false).
   * Default: "#2563eb" (Royal Blue)
   */
  lineColor?: string;

  /**
   * Stroke width in pixels of the straight connecting line.
   * Default: 3
   */
  lineWeight?: number;

  /**
   * Line rendering style: 'solid' for continuous line, 'dashed' for dashed flight path line.
   * Default: 'dashed'
   */
  lineStyle?: 'solid' | 'dashed';

  /**
   * Custom dash pattern for the connecting line (e.g. "6, 8" or "10, 10").
   * Overrides lineStyle if provided.
   */
  lineDashArray?: string;

  /**
   * Opacity of the connecting line (between 0 and 1).
   * Default: 0.85
   */
  lineOpacity?: number;

  /**
   * Custom CSS class name for the map container element.
   */
  className?: string;

  /**
   * Inline style object for the map container element.
   */
  style?: CSSProperties;

  /**
   * Width of the map container (e.g. "100%", "600px", or number for px).
   * Default: "100%"
   */
  width?: string | number;

  /**
   * Height of the map container (e.g. "500px", "100vh", or number for px).
   * Default: "450px"
   */
  height?: string | number;

  /**
   * Custom tile layer URL template.
   * Default: OpenStreetMap standard tile server
   * ("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
   */
  tileLayerUrl?: string;

  /**
   * Custom tile layer attribution HTML string.
   * Default: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
   */
  attribution?: string;

  /**
   * Minimum zoom level allowed for the map.
   * Default: 1
   */
  minZoom?: number;

  /**
   * Maximum zoom level allowed for the map.
   * Default: 19
   */
  maxZoom?: number;

  /**
   * Padding in pixels around bounds when fitting both start and end points.
   * Default: [50, 50]
   */
  fitBoundsPadding?: [number, number];

  /**
   * Optional callback when real road route is calculated.
   * Provides distance, duration, and turn-by-turn road coordinates.
   */
  onRouteCalculated?: (route: RouteInfo) => void;

  /**
   * Optional callback when the map is clicked.
   * Provides the clicked geographical Coordinates { lat, lng }.
   */
  onClick?: (coords: Coordinates) => void;

  /**
   * Optional callback fired when the map zoom level changes (via mouse wheel, pinch, buttons, or double-click).
   */
  onZoomChange?: (zoom: number) => void;

  /**
   * Optional callback when the map is initialized and ready.
   */
  onMapReady?: (mapInstance: unknown) => void;

  /**
   * Whether to display an embedded geocoding address search bar on top of the map.
   * Default: false
   */
  showSearch?: boolean;

  /**
   * Placeholder text for the embedded address search bar.
   * Default: "Search address, city, or place..."
   */
  searchPlaceholder?: string;

  /**
   * Callback fired when an address is selected from the embedded search bar.
   */
  onSearchResultSelect?: (result: GeocodeResult) => void;

  /**
   * Optional callback when reverse geocoding is performed for a clicked coordinate.
   */
  onReverseGeocode?: (result: GeocodeResult) => void;

  /**
   * Whether to display the user's live GPS location as a pulsing blue dot on the map.
   * Default: false
   */
  showUserLocation?: boolean;

  /**
   * Whether to continuously track the user's live GPS movement in real-time.
   * Default: false
   */
  trackUserLocation?: boolean;

  /**
   * Whether to display a floating "Locate Me" GPS crosshair button on the map canvas.
   * Default: false
   */
  showLocateControl?: boolean;

  /**
   * Callback fired when the user's live GPS coordinates are detected or updated.
   */
  onUserLocationChange?: (coords: LiveLocationResult) => void;

  /**
   * Whether map marker pins can be dragged interactively to adjust location.
   * Default: true
   */
  draggableMarkers?: boolean;

  /**
   * Callback fired when the Start (A) marker is dragged and dropped to a new position.
   */
  onStartDragEnd?: (coords: Coordinates) => void;

  /**
   * Callback fired when the End (B) marker is dragged and dropped to a new position.
   */
  onEndDragEnd?: (coords: Coordinates) => void;
}

/**
 * Validation result for coordinate checks.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Detailed breakdown of address components from a geocoding result.
 */
export interface AddressDetails {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
  [key: string]: string | undefined;
}

/**
 * Result returned by forward and reverse geocoding queries.
 */
export interface GeocodeResult {
  /**
   * Full, formatted display address name.
   */
  displayName: string;

  /**
   * Geographic coordinates (lat, lng).
   */
  coordinates: Coordinates;

  /**
   * Short name or place title (e.g., "Eiffel Tower", "Chennai Central").
   */
  name?: string;

  /**
   * Structured breakdown of address parts (city, state, country, postcode, etc.).
   */
  addressDetails?: AddressDetails;

  /**
   * Bounding box [minLat, maxLat, minLng, maxLng] if available.
   */
  boundingBox?: [number, number, number, number];

  /**
   * Type or category of place (e.g., 'building', 'amenity', 'city', 'highway').
   */
  type?: string;

  /**
   * Importance / relevance score of the result (between 0 and 1).
   */
  importance?: number;
}

/**
 * Options for forward address geocoding searches.
 */
export interface GeocodeOptions {
  /**
   * Maximum number of search results to return.
   * Default: 5
   */
  limit?: number;

  /**
   * Preferred language code for results (e.g. 'en', 'fr', 'es').
   * Default: 'en'
   */
  language?: string;

  /**
   * Restrict search results to specific country codes (e.g., ['us', 'in', 'fr']).
   */
  countryCodes?: string[];

  /**
   * Custom Nominatim or compatible geocoding endpoint URL.
   * Default: "https://nominatim.openstreetmap.org/search"
   */
  customEndpoint?: string;
}

/**
 * Options for reverse geocoding (coordinates to address).
 */
export interface ReverseGeocodeOptions {
  /**
   * Preferred language code for results (e.g. 'en', 'fr').
   * Default: 'en'
   */
  language?: string;

  /**
   * Level of detail zoom level (from 0 = country to 18 = building/house).
   * Default: 18
   */
  zoom?: number;

  /**
   * Custom Nominatim or compatible reverse geocoding endpoint URL.
   * Default: "https://nominatim.openstreetmap.org/reverse"
   */
  customEndpoint?: string;
}

/**
 * Props for the AddressSearch autocomplete component.
 */
export interface AddressSearchProps {
  /**
   * Placeholder text for search input.
   * Default: "Search address, city, or place..."
   */
  placeholder?: string;

  /**
   * Callback fired when a user selects a location from the search dropdown.
   */
  onSelect: (result: GeocodeResult) => void;

  /**
   * Optional initial input value.
   */
  initialValue?: string;

  /**
   * Optional custom CSS class name for the search container.
   */
  className?: string;

  /**
   * Optional inline styles for the search container.
   */
  style?: CSSProperties;

  /**
   * Geocoding query options (limit, countryCodes, language, etc.).
   */
  options?: GeocodeOptions;

  /**
   * Whether the input is disabled.
   */
  disabled?: boolean;

  /**
   * Debounce delay in milliseconds before triggering the search request.
   * Default: 300ms
   */
  debounceMs?: number;

  /**
   * Whether to clear the input text automatically upon item selection.
   * Default: false
   */
  clearOnSelect?: boolean;
}
