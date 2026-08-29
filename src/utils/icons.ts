import type L from 'leaflet';

/**
 * Generates an SVG string for the Start point marker pin (Emerald Green with 'A' badge).
 */
export function createStartPinSvg(): string {
  return `
    <div style="width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg viewBox="0 0 34 44" width="34" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); transition: transform 0.2s ease;">
        <defs>
          <linearGradient id="startGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <path d="M17 0C7.61 0 0 7.61 0 17c0 11.8 15.3 26.2 15.98 26.85a1.4 1.4 0 002.04 0C18.7 43.2 34 28.8 34 17 34 7.61 26.39 0 17 0z" fill="url(#startGrad)"/>
        <circle cx="17" cy="16" r="10" fill="#ffffff"/>
        <text x="17" y="20.5" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#047857" text-anchor="middle">A</text>
      </svg>
    </div>
  `.trim();
}

/**
 * Generates an SVG string for the End point marker pin (Rose Red with 'B' badge).
 */
export function createEndPinSvg(): string {
  return `
    <div style="width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg viewBox="0 0 34 44" width="34" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35)); transition: transform 0.2s ease;">
        <defs>
          <linearGradient id="endGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f43f5e"/>
            <stop offset="100%" stop-color="#be123c"/>
          </linearGradient>
        </defs>
        <path d="M17 0C7.61 0 0 7.61 0 17c0 11.8 15.3 26.2 15.98 26.85a1.4 1.4 0 002.04 0C18.7 43.2 34 28.8 34 17 34 7.61 26.39 0 17 0z" fill="url(#endGrad)"/>
        <circle cx="17" cy="16" r="10" fill="#ffffff"/>
        <text x="17" y="20.5" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="#be123c" text-anchor="middle">B</text>
      </svg>
    </div>
  `.trim();
}

/**
 * Creates a Leaflet DivIcon for the Start marker.
 */
export function getStartDivIcon(leafletInstance: typeof L): L.DivIcon {
  return leafletInstance.divIcon({
    className: 'react-map-sdk-start-marker',
    html: createStartPinSvg(),
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44]
  });
}

/**
 * Creates a Leaflet DivIcon for the End marker.
 */
export function getEndDivIcon(leafletInstance: typeof L): L.DivIcon {
  return leafletInstance.divIcon({
    className: 'react-map-sdk-end-marker',
    html: createEndPinSvg(),
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44]
  });
}
