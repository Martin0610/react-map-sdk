# <img src="https://api.iconify.design/lucide:map.svg?color=%232563eb" width="28" height="28" align="absmiddle" /> React Map SDK

<div align="center">

A lightweight, enterprise-grade React Map SDK built with **TypeScript**, **Leaflet**, and **OpenStreetMap**.

Integrate interactive maps, turn-by-turn road routing, realistic ETA calculation, address autocomplete, and reverse geocoding with a single declarative React component — **100% free with zero API keys required**.

[![npm version](https://img.shields.io/badge/npm-v1.0.1-blue.svg)](https://www.npmjs.com/package/react-map-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![API Keys](https://img.shields.io/badge/API%20Keys-Zero%20Required-brightgreen.svg)](https://github.com/Martin0610/react-map-sdk)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9.4-199900.svg)](https://leafletjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Martin0610/react-map-sdk/pulls)

</div>

---

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> Key Features

| Feature | Description |
| :--- | :--- |
| <img src="https://api.iconify.design/lucide:map.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Zero-Config Map** | Instant OpenStreetMap tile rendering with zero API keys, billing accounts, or setup friction. |
| <img src="https://api.iconify.design/lucide:route.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Turn-by-Turn Road Routing** | Real road trajectory polylines powered by high-performance OSRM routing. |
| <img src="https://api.iconify.design/lucide:clock.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Realistic Traffic ETA** | Intelligent speed weighting for City ($\sim 28\text{ km/h}$), Suburban ($\sim 38\text{ km/h}$), and Highway ($\sim 65\text{ km/h}$) routes. |
| <img src="https://api.iconify.design/lucide:search.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Address Autocomplete** | Embedded `<AddressSearch />` geocoding bar for instant landmark and place searches. |
| <img src="https://api.iconify.design/lucide:map-pin.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Reverse Geocoding** | Automatically resolve `{ lat, lng }` coordinates into formatted street addresses and city names. |
| <img src="https://api.iconify.design/lucide:crosshair.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Draggable Marker Pins** | Custom SVG Emerald (Point A) and Rose (Point B) pins with real-time drag handlers. |
| <img src="https://api.iconify.design/lucide:zoom-in.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Bidirectional Zoom Sync** | `onZoomChange` event listener syncs mouse wheel, trackpad pinch, and `+`/`-` buttons in real time. |
| <img src="https://api.iconify.design/lucide:car.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Multi-Modal Travel** | Seamlessly switch between **Car / Driving**, **Bike / Cycling**, and **Walking** modes. |
| <img src="https://api.iconify.design/lucide:maximize-2.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Auto Bounds & Centering** | Automatically calculates the optimal bounding box, zoom level, and padding for routes. |
| <img src="https://api.iconify.design/lucide:shield-check.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **Coordinate Validation** | Strict input boundary checking prevents silent rendering bugs. |
| <img src="https://api.iconify.design/lucide:zap.svg?color=%232563eb" width="16" height="16" align="absmiddle" /> **SSR Safe** | Fully compatible with Next.js (App & Pages Routers), Remix, Vite, and Create React App. |

---

## <img src="https://api.iconify.design/lucide:package.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> Installation

```bash
npm install react-map-sdk leaflet
```

Or using Yarn / pnpm:

```bash
# Yarn
yarn add react-map-sdk leaflet

# pnpm
pnpm add react-map-sdk leaflet
```

*(Note: `leaflet` is specified as a peer dependency).*

---

## <img src="https://api.iconify.design/lucide:rocket.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> Quick Start Examples

### 1. Road Routing with Realistic ETA

```tsx
import React from 'react';
import { Map, type RouteInfo } from 'react-map-sdk';

export function RouteOverview() {
  return (
    <Map
      start={{ lat: 12.9202, lng: 79.1325 }} // Vellore Fort
      startName="Vellore Fort"
      end={{ lat: 13.0827, lng: 80.2707 }}   // Chennai Central
      endName="Chennai Central"
      routing={true}
      routingProfile="car" // 'car' | 'bike' | 'walking'
      routeColor="#2563eb"
      draggableMarkers={true}
      onRouteCalculated={(info: RouteInfo) => {
        console.log(`Distance: ${info.distanceKm} km`);
        console.log(`Realistic ETA: ${info.durationFormatted}`);
      }}
      height="520px"
    />
  );
}
```

---

### 2. Searchable Map with Address Autocomplete

```tsx
import React, { useState } from 'react';
import { Map, AddressSearch, type Coordinates, type GeocodeResult } from 'react-map-sdk';

export function SearchableMap() {
  const [center, setCenter] = useState<Coordinates>({ lat: 48.8584, lng: 2.2945 }); // Paris
  const [zoom, setZoom] = useState(14);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <AddressSearch
        placeholder="Search any landmark, city, or address..."
        onSelect={(result: GeocodeResult) => {
          setCenter(result.coordinates);
        }}
      />
      <Map
        center={center}
        zoom={zoom}
        onZoomChange={(newZoom) => setZoom(newZoom)}
        height="500px"
        style={{ marginTop: '12px', borderRadius: '12px' }}
      />
    </div>
  );
}
```

---

### 3. Programmatic Geocoding & Reverse Geocoding

```ts
import { geocodeAddress, reverseGeocode } from 'react-map-sdk';

// 1. Forward Geocoding (Address -> Coordinates)
const results = await geocodeAddress('Eiffel Tower, Paris');
console.log(results[0].coordinates); // { lat: 48.8584, lng: 2.2945 }
console.log(results[0].displayName); // "Tour Eiffel, 5, Avenue Anatole France..."

// 2. Reverse Geocoding (Coordinates -> Address)
const place = await reverseGeocode({ lat: 13.0827, lng: 80.2707 });
console.log(place?.displayName); // "Chennai Central, Poonamallee High Road, Chennai..."
```

---

## <img src="https://api.iconify.design/lucide:wrench.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> API Reference

### `<Map />` (`MapProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `start` | `Coordinates` | `undefined` | Starting point coordinates (`{ lat, lng }`). Displays Emerald marker (Point A). |
| `startName` | `string` | `undefined` | Custom label or place name for Point A marker popup/tooltip. |
| `end` | `Coordinates` | `undefined` | Destination point coordinates (`{ lat, lng }`). Displays Rose marker (Point B). |
| `endName` | `string` | `undefined` | Custom label or place name for Point B marker popup/tooltip. |
| `routing` | `boolean` | `true` | Enables turn-by-turn road route polyline calculation. |
| `routingProfile` | `'car' \| 'bike' \| 'walking'` | `'car'` | Travel mode for road routing and ETA calculation. |
| `routeColor` | `string` | `"#3b82f6"` | Color hex/rgb of the road route polyline. |
| `routeWeight` | `number` | `5` | Line stroke width in pixels. |
| `draggableMarkers` | `boolean` | `true` | Enables interactive dragging of Point A and Point B pins. |
| `onStartDragEnd` | `(coords: Coordinates) => void` | `undefined` | Callback fired when the Point A pin is dragged to a new position. |
| `onEndDragEnd` | `(coords: Coordinates) => void` | `undefined` | Callback fired when the Point B pin is dragged to a new position. |
| `onZoomChange` | `(zoom: number) => void` | `undefined` | Real-time callback when zoom changes via mouse scroll, pinch, or buttons. |
| `onRouteCalculated` | `(route: RouteInfo) => void` | `undefined` | Callback providing calculated distance (km), ETA, and road coordinates. |
| `onClick` | `(coords: Coordinates) => void` | `undefined` | Callback fired on map click with clicked `{ lat, lng }`. |
| `center` | `Coordinates` | *Auto* | Initial viewport center coordinates. |
| `zoom` | `number` | `13` | Initial map zoom level ($1 - 19$). |
| `height` | `string \| number` | `"450px"` | Map container height. |
| `width` | `string \| number` | `"100%"` | Map container width. |

---

### `<AddressSearch />` (`AddressSearchProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onSelect` | `(result: GeocodeResult) => void` | *Required* | Callback fired when user selects an address suggestion. |
| `placeholder` | `string` | `"Search address..."` | Placeholder text for the search input. |
| `initialValue` | `string` | `""` | Initial text value for the search bar. |
| `debounceMs` | `number` | `300` | Input debounce delay in milliseconds. |
| `disabled` | `boolean` | `false` | Disables the search input field. |

---

## <img src="https://api.iconify.design/lucide:file-code.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> TypeScript Types

```ts
import type {
  Coordinates,
  MapProps,
  RouteInfo,
  TravelProfile,
  GeocodeResult,
  AddressDetails,
  GeocodeOptions,
  ReverseGeocodeOptions
} from 'react-map-sdk';
```

---

## <img src="https://api.iconify.design/lucide:globe.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> Next.js & SSR Compatibility

`react-map-sdk` is built to run seamlessly in Server-Side Rendered (SSR) environments including **Next.js 13/14/15 (App & Pages router)**, **Remix**, and **Vite**.

```tsx
'use client';

import { Map } from 'react-map-sdk';

export default function DeliveryPage() {
  return (
    <main>
      <h1>Order Tracking</h1>
      <Map
        start={{ lat: 12.9202, lng: 79.1325 }}
        end={{ lat: 13.0827, lng: 80.2707 }}
        routing={true}
        height="500px"
      />
    </main>
  );
}
```

---

## <img src="https://api.iconify.design/lucide:terminal.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Build SDK packages (ESM, CJS, DTS)
npm run build

# 4. Start interactive demo app
npm --prefix example run dev
```

---

## <img src="https://api.iconify.design/lucide:file-text.svg?color=%232563eb" width="22" height="22" align="absmiddle" /> License

MIT © 2026 Martin0610

