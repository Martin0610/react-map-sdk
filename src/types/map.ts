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
   * Whether to display a connecting direct line between the start and end points.
   * Default: true when both start and end coordinates are provided.
   */
  showLine?: boolean;

  /**
   * Color of the connecting line between start and end points.
   * Default: "#2563eb" (Royal Blue)
   */
  lineColor?: string;

  /**
   * Stroke width in pixels of the connecting line.
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
