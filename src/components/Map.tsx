import React, { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import type { MapProps } from '../types/map';
import { validateCoordinates } from '../utils/validation';
import { calculateInitialCenter, calculateInitialZoom } from '../utils/bounds';
import { getStartDivIcon, getEndDivIcon } from '../utils/icons';

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
  end,
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
  onClick,
  onMapReady
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const leafletModuleRef = useRef<typeof L | null>(null);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

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

        // Initial render of markers, line, and bounds
        updateMarkersAndBounds(L, map, true);

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, tileLayerUrl, attribution, minZoom, maxZoom]);

  /**
   * Helper to update markers, connecting line, and auto-fit bounds
   */
  const updateMarkersAndBounds = (
    L: typeof import('leaflet'),
    map: L.Map,
    isInitial = false
  ) => {
    // 1. Handle Start Marker
    const startValidation = start ? validateCoordinates(start, 'start') : null;
    if (start && startValidation?.isValid) {
      const startIcon = getStartDivIcon(L);
      if (startMarkerRef.current) {
        startMarkerRef.current.setLatLng([start.lat, start.lng]);
        startMarkerRef.current.setPopupContent(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#047857;">📍 Starting Point (A)</b><br/><span style="font-size:12px;color:#475569;">Lat: ${start.lat.toFixed(4)}, Lng: ${start.lng.toFixed(4)}</span></div>`
        );
      } else {
        const marker = L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map);
        marker.bindTooltip('<b>Starting Point (A)</b>', { direction: 'top', offset: [0, -42] });
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#047857;">📍 Starting Point (A)</b><br/><span style="font-size:12px;color:#475569;">Lat: ${start.lat.toFixed(4)}, Lng: ${start.lng.toFixed(4)}</span></div>`
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
      if (endMarkerRef.current) {
        endMarkerRef.current.setLatLng([end.lat, end.lng]);
        endMarkerRef.current.setPopupContent(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#be123c;">🏁 Destination Point (B)</b><br/><span style="font-size:12px;color:#475569;">Lat: ${end.lat.toFixed(4)}, Lng: ${end.lng.toFixed(4)}</span></div>`
        );
      } else {
        const marker = L.marker([end.lat, end.lng], { icon: endIcon }).addTo(map);
        marker.bindTooltip('<b>Destination Point (B)</b>', { direction: 'top', offset: [0, -42] });
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;padding:2px 4px;"><b style="color:#be123c;">🏁 Destination Point (B)</b><br/><span style="font-size:12px;color:#475569;">Lat: ${end.lat.toFixed(4)}, Lng: ${end.lng.toFixed(4)}</span></div>`
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

    // 3. Handle Connecting Line between Start and End
    const startValid = Boolean(start && startValidation?.isValid);
    const endValid = Boolean(end && endValidation?.isValid);

    if (startValid && endValid && start && end && showLine) {
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
        const line = L.polyline(lineCoords, {
          color: lineColor,
          weight: lineWeight,
          opacity: lineOpacity,
          dashArray: effectiveDash || undefined
        }).addTo(map);
        polylineRef.current = line;
      }
    } else {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    }

    // 4. Handle bounds / center adjustment
    // If explicit center was provided by user, prioritize user center
    if (center && validateCoordinates(center, 'center').isValid) {
      if (!isInitial) {
        map.setView([center.lat, center.lng], zoom ?? map.getZoom());
      }
      return;
    }

    // If both start and end exist, auto-fit bounds
    if (startValid && endValid && start && end) {
      const bounds = L.latLngBounds([
        [start.lat, start.lng],
        [end.lat, end.lng]
      ]);
      map.fitBounds(bounds, {
        padding: fitBoundsPadding,
        maxZoom: 16
      });
    } else if (startValid && start && !isInitial) {
      map.panTo([start.lat, start.lng]);
    } else if (endValid && end && !isInitial) {
      map.panTo([end.lat, end.lng]);
    }
  };

  // Sync prop changes (start, end, center, zoom, line settings) without destroying the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletModuleRef.current;

    if (!map || !L) return;

    updateMarkersAndBounds(L, map, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    start?.lat,
    start?.lng,
    end?.lat,
    end?.lng,
    center?.lat,
    center?.lng,
    zoom,
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
