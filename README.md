# react-map-sdk

A lightweight, reusable React Map SDK built with **TypeScript**, **Leaflet**, and **OpenStreetMap**.

Integrate interactive maps and render starting and ending point markers with a single declarative React component — **zero API keys required**.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/react-map-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- 🗺️ **Zero-Configuration Map**: Instant OpenStreetMap tile rendering without any API keys or billing accounts.
- 🔍 **100% Free Geocoding & Autocomplete**: Search addresses and landmarks with `<AddressSearch />` and `geocodeAddress()` with zero API keys.
- 📍 **Reverse Geocoding**: Automatically convert `{ lat, lng }` coordinates to formatted street addresses with `reverseGeocode()`.
- 🚗 **Real Road Routing & ETA**: Turn-by-turn road trajectory, precise distance (km), and estimated travel time powered by OSRM.
- 🟢 **Starting Point Marker**: Clearly distinguished emerald pin (Point A) with coordinate validation.
- 🔴 **Ending Point Marker**: Clearly distinguished rose red pin (Point B) with coordinate validation.
- 📐 **Automatic Bounds & Centering**: Automatically calculates optimal bounding box, zoom, and padding.
- 🛡️ **Strict Coordinate Validation**: Prevents silent map bugs by validating latitude (`-90` to `90`) and longitude (`-180` to `180`).
- ⚡ **SSR Safe**: Compatible with Next.js (App & Pages routers), Vite, Remix, and Create React App.
- 📦 **Dual ESM & CJS Build**: Bundled with `tsup` for maximum tree-shaking and compatibility.
- 📐 **Self-Contained SVG Markers**: No broken Leaflet marker image paths in modern bundlers.

---

## 📦 Installation

```bash
npm install react-map-sdk leaflet
```

Or using Yarn / pnpm:

```bash
yarn add react-map-sdk leaflet
# or
pnpm add react-map-sdk leaflet
```

*(Note: `leaflet` is a peer dependency).*

---

## ⚡ Quick Start

### 1. Turn-by-Turn Road Route & ETA (Zero API Keys)

```tsx
import React from 'react';
import { Map, type RouteInfo } from 'react-map-sdk';

export function RouteOverview() {
  return (
    <Map
      start={{ lat: 12.9716, lng: 79.1597 }} // Vellore
      startName="Vellore Fort"
      end={{ lat: 13.0827, lng: 80.2707 }}   // Chennai
      endName="Chennai Central"
      routing={true}
      routingProfile="driving" // 'driving' | 'walking' | 'cycling'
      onRouteCalculated={(info: RouteInfo) => {
        console.log(`Distance: ${info.distanceKm} km, ETA: ${info.durationFormatted}`);
      }}
      height="500px"
    />
  );
}
```

---

### 2. Address Search Autocomplete (Geocoding)

```tsx
import React, { useState } from 'react';
import { Map, AddressSearch, type GeocodeResult } from 'react-map-sdk';

export function SearchableMap() {
  const [coords, setCoords] = useState({ lat: 48.8584, lng: 2.2945 }); // Paris

  return (
    <div style={{ maxWidth: '600px' }}>
      <AddressSearch
        placeholder="Search any place or address..."
        onSelect={(result: GeocodeResult) => {
          console.log('Selected:', result.displayName, result.coordinates);
          setCoords(result.coordinates);
        }}
      />
      <Map center={coords} zoom={14} height="450px" style={{ marginTop: '10px' }} />
    </div>
  );
}
```

---

### 3. Programmatic Geocoding & Reverse Geocoding

```ts
import { geocodeAddress, reverseGeocode } from 'react-map-sdk';

// 1. Forward Geocoding: Address -> Coordinates
const results = await geocodeAddress('Eiffel Tower, Paris');
console.log(results[0].coordinates); // { lat: 48.8584, lng: 2.2945 }
console.log(results[0].displayName); // "Tour Eiffel, 5, Avenue Anatole France..."

// 2. Reverse Geocoding: Coordinates -> Address
const location = await reverseGeocode({ lat: 12.9716, lng: 79.1597 });
console.log(location?.displayName); // "Vellore, Tamil Nadu, India"
```

---

## 🛠️ Component API

### `<Map />` (`MapProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `start` | `Coordinates` | `undefined` | Starting point coordinates (`{ lat, lng }`). Displays a green marker (Point A). |
| `startName` | `string` | `undefined` | Custom label or name for starting point marker. |
| `end` | `Coordinates` | `undefined` | Ending point coordinates (`{ lat, lng }`). Displays a red marker (Point B). |
| `endName` | `string` | `undefined` | Custom label or name for destination marker. |
| `routing` | `boolean` | `true` | Enables real Google Maps-style road routing via OSRM (100% free). |
| `routingProfile` | `'driving' \| 'walking' \| 'cycling'` | `'driving'` | Travel mode for routing. |
| `routeColor` | `string` | `"#3b82f6"` | Color of the road route line. |
| `routeWeight` | `number` | `5` | Stroke width in pixels of road route line. |
| `showLine` | `boolean` | `true` | Fallback connecting straight line if routing is disabled. |
| `center` | `Coordinates` | *Derived* | Initial center coordinates. If omitted, derived from `start`/`end`. |
| `zoom` | `number` | `13` (or auto) | Initial zoom level. |
| `width` | `string \| number` | `"100%"` | Width of map container. |
| `height` | `string \| number` | `"450px"` | Height of map container. |
| `showSearch` | `boolean` | `false` | Displays an embedded address search bar inside the map. |
| `onRouteCalculated` | `(route: RouteInfo) => void` | `undefined` | Callback fired with road trajectory, distance (km), and ETA. |
| `onClick` | `(coords: Coordinates) => void` | `undefined` | Callback fired when map is clicked with `{ lat, lng }`. |
| `onReverseGeocode` | `(result: GeocodeResult) => void` | `undefined` | Callback fired with reverse geocoded address when map is clicked. |

---

### `<AddressSearch />` (`AddressSearchProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onSelect` | `(result: GeocodeResult) => void` | *Required* | Callback triggered when an address item is selected. |
| `placeholder` | `string` | `"Search address..."` | Placeholder text for search input. |
| `initialValue` | `string` | `""` | Initial input query. |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds before querying. |
| `disabled` | `boolean` | `false` | Disables search input. |
| `options` | `GeocodeOptions` | `{}` | Optional query filters (limit, language, countryCodes). |

---

## 🔷 TypeScript Types

```ts
import type {
  Coordinates,
  MapProps,
  RouteInfo,
  GeocodeResult,
  AddressDetails,
  GeocodeOptions,
  ReverseGeocodeOptions
} from 'react-map-sdk';
```

---

## 🌐 Next.js & Framework Compatibility

`react-map-sdk` is built to be SSR-safe.

### Next.js App Router (`app/` directory)

```tsx
'use client';

import { Map } from 'react-map-sdk';

export default function Page() {
  return (
    <main>
      <h1>Delivery Route</h1>
      <Map
        start={{ lat: 12.9716, lng: 79.1597 }}
        end={{ lat: 13.0827, lng: 80.2707 }}
        routing={true}
        height="500px"
      />
    </main>
  );
}
```

---

## 💻 Development & Building

```bash
# Install dependencies
npm install

# Run unit tests
npm run test

# Build SDK packages (ESM, CJS, Types)
npm run build

# Run interactive demo app
cd example && npm install && npm run dev
```

---

## 🗺️ Roadmap

- **Multi-Provider Architecture**: Bring-your-own-key adapters for Google Maps JS API and Mapbox GL JS.
- **Waypoints & Multi-Stop Routing**: Support for intermediate stops (Point A $\rightarrow$ B $\rightarrow$ C $\rightarrow$ D).
- **Live Location Tracking**: WebSocket & GPS location stream overlay.

---

## 📄 License

MIT © 2026
