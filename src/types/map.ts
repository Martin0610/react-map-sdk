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
   * Travel profile used ('driving', 'walking', 'cycling').
   */
  profile: 'driving' | 'walking' | 'cycling';
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
   * Ending point coordinates.
   * Renders a clearly distinguished End marker on the map.
   */
  end?: Coordinates;

  /**
   * Whether to calculate and display real Google Maps-style turn-by-turn road routing
   * between the start and end points using OSRM (100% free, zero API keys required).
   * Default: true when both start and end coordinates are provided.
   */
  routing?: boolean;

  /**
   * Travel profile for road routing: 'driving' (default), 'walking', or 'cycling'.
   * Default: 'driving'
   */
  routingProfile?: 'driving' | 'walking' | 'cycling';

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
   * Optional callback when the map is initialized and ready.
   */
  onMapReady?: (mapInstance: unknown) => void;
}

/**
 * Validation result for coordinate checks.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
