import React, { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import type { MapProps } from '../types/map';
import { validateCoordinates } from '../utils/validation';
import { calculateInitialCenter, calculateInitialZoom } from '../utils/bounds';
import { getStartDivIcon, getEndDivIcon } from '../utils/icons';
import { fetchRoadRoute } from '../utils/routing';

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const LEAFLET_CSS_ID = 'react-map-sdk-leaflet-css';

/**
 * Ensures Leaflet CSS is injected in the document head if not already loaded.
 */
function ensureLeafletCss(): void {
  if (typeof document === 'undefined') return;

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement('link');
    link.id = LEAFLET_CSS_ID;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
}

/**
 * Map Component
 *
 * A lightweight, reusable React Map component powered by Leaflet and OpenStreetMap.
 */
export const Map: React.FC<MapProps> = ({
  center,
  zoom,
  start,
  startName,
  end,
  endName,
  routing = true,
  routingProfile = 'driving',
  routeColor = '#3b82f6',
  routeWeight = 5,
  showLine = true,
  lineColor = '#2563eb',
  lineWeight = 3,
  lineStyle = 'dashed',
  lineDashArray,
  lineOpacity = 0.85,
  className,
  style,
  width = '100%',
  height = '450px',
  tileLayerUrl = DEFAULT_TILE_URL,
  attribution = DEFAULT_ATTRIBUTION,
  minZoom = 1,
  maxZoom = 19,
  fitBoundsPadding = [50, 50],
  onRouteCalculated,
  onClick,
  onMapReady
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const routeFillRef = useRef<L.Polyline | null>(null);
  const leafletModuleRef = useRef<typeof L | null>(null);
  const isRoutingActiveRef = useRef<number>(0);

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  onRouteCalculatedRef.current = onRouteCalculated;

  const [isClient, setIsClient] = useState(false);

  // SSR check
  useEffect(() => {
    setIsClient(true);
    ensureLeafletCss();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const leaflet = await import('leaflet');
        // Leaflet default export handling for different bundlers
        const L = (leaflet.default || leaflet) as typeof import('leaflet');
        leafletModuleRef.current = L;

        if (!isMounted || !containerRef.current) return;

        // If map already exists on this container, clean it up before recreating
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const initialCenter = calculateInitialCenter({ center, start, end });
        const initialZoom = calculateInitialZoom({ zoom, center, start, end });

        const map = L.map(containerRef.current, {
          minZoom,
          maxZoom,
          zoomControl: true
        }).setView([initialCenter.lat, initialCenter.lng], initialZoom);

        mapInstanceRef.current = map;

        // Add OSM tile layer
        L.tileLayer(tileLayerUrl, {
          attribution,
          maxZoom
        }).addTo(map);

        // Handle map click events
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onClickRef.current) {
            onClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
          }
        });

        // Initial render of markers, route, and bounds
        updateMarkersAndRoute(L, map, true);

        if (onMapReady) {
          onMapReady(map);
        }
      } catch (err) {
        console.error('[react-map-sdk] Failed to initialize map:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      startMarkerRef.current = null;
      endMarkerRef.current = null;
      polylineRef.current = null;
      routeCasingRef.current = null;
      routeFillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, tileLayerUrl, attribution, minZoom, maxZoom]);

  /**
   * Helper to clean up road routing layers
   */
  const clearRoadRoute = (map: L.Map) => {
    if (routeCasingRef.current) {
      map.removeLayer(routeCasingRef.current);
      routeCasingRef.current = null;
    }
    if (routeFillRef.current) {
      map.removeLayer(routeFillRef.current);
      routeFillRef.current = null;
    }
  };

  /**
   * Helper to clean up straight line layer
   */
  const clearDirectLine = (map: L.Map) => {
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  };

  /**
   * Helper to update markers, Google Maps-style road routing, and bounds
   */
  const updateMarkersAndRoute = (
    L: typeof import('leaflet'),
    map: L.Map,
    isInitial = false
  ) => {
    // 1. Handle Start Marker
    const startValidation = start ? validateCoordinates(start, 'start') : null;
    if (start && startValidation?.isValid) {
      const startIcon = getStartDivIcon(L);
      const startLabel = startName ? `📍 ${startName}` : '📍 Starting Point (A)';
      if (startMarkerRef.current) {
        startMarkerRef.current.setLatLng([start.lat, start.lng]);
        startMarkerRef.current.setPopupContent(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#047857;">${startLabel}</b><br/><span style="font-size:12px;color:#475569;">Lat: ${start.lat.toFixed(4)}, Lng: ${start.lng.toFixed(4)}</span></div>`
        );
      } else {
        const marker = L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map);
        marker.bindTooltip(`<b>${startLabel}</b>`, { direction: 'top', offset: [0, -42] });
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#047857;">${startLabel}</b><br/><span style="font-size:12px;color:#475569;">Lat: ${start.lat.toFixed(4)}, Lng: ${start.lng.toFixed(4)}</span></div>`
        );
        startMarkerRef.current = marker;
      }
    } else {
      if (start && startValidation && !startValidation.isValid) {
        console.warn(`[react-map-sdk] ${startValidation.error}`);
      }
      if (startMarkerRef.current) {
        map.removeLayer(startMarkerRef.current);
        startMarkerRef.current = null;
      }
    }

    // 2. Handle End Marker
    const endValidation = end ? validateCoordinates(end, 'end') : null;
    if (end && endValidation?.isValid) {
      const endIcon = getEndDivIcon(L);
      const endLabel = endName ? `🏁 ${endName}` : '🏁 Destination Point (B)';
      if (endMarkerRef.current) {
        endMarkerRef.current.setLatLng([end.lat, end.lng]);
        endMarkerRef.current.setPopupContent(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#be123c;">${endLabel}</b><br/><span style="font-size:12px;color:#475569;">Lat: ${end.lat.toFixed(4)}, Lng: ${end.lng.toFixed(4)}</span></div>`
        );
      } else {
        const marker = L.marker([end.lat, end.lng], { icon: endIcon }).addTo(map);
        marker.bindTooltip(`<b>${endLabel}</b>`, { direction: 'top', offset: [0, -42] });
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#be123c;">${endLabel}</b><br/><span style="font-size:12px;color:#475569;">Lat: ${end.lat.toFixed(4)}, Lng: ${end.lng.toFixed(4)}</span></div>`
        );
        endMarkerRef.current = marker;
      }
    } else {
      if (end && endValidation && !endValidation.isValid) {
        console.warn(`[react-map-sdk] ${endValidation.error}`);
      }
      if (endMarkerRef.current) {
        map.removeLayer(endMarkerRef.current);
        endMarkerRef.current = null;
      }
    }

    const startValid = Boolean(start && startValidation?.isValid);
    const endValid = Boolean(end && endValidation?.isValid);

    // 3. Handle Route / Line Drawing
    if (startValid && endValid && start && end) {
      if (routing) {
        // Clear any straight line
        clearDirectLine(map);

        const requestId = ++isRoutingActiveRef.current;

        // Fetch turn-by-turn road trajectory
        fetchRoadRoute(start, end, routingProfile).then((routeInfo) => {
          if (isRoutingActiveRef.current !== requestId || !mapInstanceRef.current) return;

          const roadLatLngs: [number, number][] = routeInfo.coordinates.map((c) => [c.lat, c.lng]);

          // Layer 1: Google Maps outer dark blue casing for crisp road border
          if (routeCasingRef.current) {
            routeCasingRef.current.setLatLngs(roadLatLngs);
            routeCasingRef.current.setStyle({
              color: '#1d4ed8',
              weight: routeWeight + 3,
              opacity: 0.85
            });
          } else {
            routeCasingRef.current = L.polyline(roadLatLngs, {
              color: '#1d4ed8',
              weight: routeWeight + 3,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
          }

          // Layer 2: Google Maps inner vibrant blue road fill
          if (routeFillRef.current) {
            routeFillRef.current.setLatLngs(roadLatLngs);
            routeFillRef.current.setStyle({
              color: routeColor,
              weight: routeWeight,
              opacity: 1
            });
          } else {
            routeFillRef.current = L.polyline(roadLatLngs, {
              color: routeColor,
              weight: routeWeight,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map);
          }

          if (onRouteCalculatedRef.current) {
            onRouteCalculatedRef.current(routeInfo);
          }

          // Auto-fit bounds to the road trajectory
          if (!center) {
            const bounds = L.latLngBounds(roadLatLngs);
            map.fitBounds(bounds, {
              padding: fitBoundsPadding,
              maxZoom: 16
            });
          }
        });
      } else if (showLine) {
        // Fallback: Direct Straight Line
        clearRoadRoute(map);

        const lineCoords: [number, number][] = [
          [start.lat, start.lng],
          [end.lat, end.lng]
        ];

        const effectiveDash = lineDashArray !== undefined
          ? lineDashArray
          : (lineStyle === 'solid' ? '' : '6, 8');

        if (polylineRef.current) {
          polylineRef.current.setLatLngs(lineCoords);
          polylineRef.current.setStyle({
            color: lineColor,
            weight: lineWeight,
            opacity: lineOpacity,
            dashArray: effectiveDash || ''
          });
        } else {
          polylineRef.current = L.polyline(lineCoords, {
            color: lineColor,
            weight: lineWeight,
            opacity: lineOpacity,
            dashArray: effectiveDash || undefined
          }).addTo(map);
        }

        if (!center) {
          const bounds = L.latLngBounds(lineCoords);
          map.fitBounds(bounds, {
            padding: fitBoundsPadding,
            maxZoom: 16
          });
        }
      } else {
        clearRoadRoute(map);
        clearDirectLine(map);
      }
    } else {
      clearRoadRoute(map);
      clearDirectLine(map);
    }

    // 4. Handle bounds / center adjustment when not routing
    if (center && validateCoordinates(center, 'center').isValid) {
      if (!isInitial) {
        map.setView([center.lat, center.lng], zoom ?? map.getZoom());
      }
      return;
    }

    if ((!startValid || !endValid) && !isInitial) {
      if (startValid && start) {
        map.panTo([start.lat, start.lng]);
      } else if (endValid && end) {
        map.panTo([end.lat, end.lng]);
      }
    }
  };

  // Sync prop changes without destroying the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletModuleRef.current;

    if (!map || !L) return;

    updateMarkersAndRoute(L, map, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    start?.lat,
    start?.lng,
    startName,
    end?.lat,
    end?.lng,
    endName,
    center?.lat,
    center?.lng,
    zoom,
    routing,
    routingProfile,
    routeColor,
    routeWeight,
    showLine,
    lineColor,
    lineWeight,
    lineStyle,
    lineDashArray,
    lineOpacity
  ]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'hidden',
    ...style
  };

  return (
    <div
      ref={containerRef}
      className={`react-map-sdk-container ${className || ''}`.trim()}
      style={containerStyle}
    >
      {!isClient && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: '#f8fafc',
            color: '#64748b',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px'
          }}
        >
          Loading map...
        </div>
      )}
    </div>
  );
};
