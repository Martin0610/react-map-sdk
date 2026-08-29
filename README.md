# react-map-sdk

A lightweight, reusable React Map SDK built with **TypeScript**, **Leaflet**, and **OpenStreetMap**.

Integrate interactive maps and render starting and ending point markers with a single declarative React component — **zero API keys required**.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/react-map-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features (Version 1)

- 🗺️ **Zero-Configuration Map**: Instant OpenStreetMap tile rendering without any API keys or billing accounts.
- 🟢 **Starting Point Marker**: Clearly distinguished emerald pin (Point A) with automatic coordinate validation.
- 🔴 **Ending Point Marker**: Clearly distinguished rose red pin (Point B) with automatic coordinate validation.
- 📐 **Automatic Bounds & Centering**: Automatically calculates the optimal bounding box and padding when both start and end locations are provided.
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

### 1. Start & End Points (Primary Usage)

```tsx
import React from 'react';
import { Map } from 'react-map-sdk';

export function RouteOverview() {
  return (
    <Map
      start={{ lat: 12.9716, lng: 79.1597 }} // Vellore
      end={{ lat: 13.0827, lng: 80.2707 }}   // Chennai
      height="500px"
    />
  );
}
```

When both `start` and `end` are provided, the map **automatically calculates the midpoint, fits the bounding box, and applies comfortable padding**.

---

## 📖 Usage Examples

### 2. Map with Start Point Only

```tsx
import { Map } from 'react-map-sdk';

export function StartOnlyMap() {
  return (
    <Map
      start={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
      zoom={14}
      height="450px"
    />
  );
}
```

### 3. Map with End Point Only

```tsx
import { Map } from 'react-map-sdk';

export function EndOnlyMap() {
  return (
    <Map
      end={{ lat: 34.0522, lng: -118.2437 }} // Los Angeles
      zoom={14}
      height="450px"
    />
  );
}
```

### 4. Basic Map Only (Custom Center & Zoom)

```tsx
import { Map } from 'react-map-sdk';

export function SimpleMap() {
  return (
    <Map
      center={{ lat: 51.5074, lng: -0.1278 }} // London
      zoom={12}
      height="400px"
    />
  );
}
```

---

## 🛠️ Component API (`MapProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `start` | `Coordinates` | `undefined` | Starting point coordinates (`{ lat, lng }`). Displays a green marker (Point A). |
| `end` | `Coordinates` | `undefined` | Ending point coordinates (`{ lat, lng }`). Displays a red marker (Point B). |
| `showLine` | `boolean` | `true` | Whether to draw a connecting line between start and end points. |
| `lineColor` | `string` | `"#2563eb"` | Color of the connecting line. |
| `lineWeight` | `number` | `3` | Stroke width in pixels of the connecting line. |
| `lineDashArray` | `string` | `"6, 8"` | Dash pattern (e.g. `"6, 8"` for dashed, or `undefined` for solid). |
| `lineOpacity` | `number` | `0.85` | Opacity of the connecting line (0 to 1). |
| `center` | `Coordinates` | *Derived* | Initial center coordinates. If omitted, derived from `start`/`end`. |
| `zoom` | `number` | `13` (or auto) | Initial zoom level. |
| `width` | `string \| number` | `"100%"` | Width of the map container (e.g. `"100%"`, `600`). |
| `height` | `string \| number` | `"450px"` | Height of the map container (e.g. `"500px"`, `"100vh"`, `450`). |
| `className` | `string` | `""` | Custom CSS class name for the wrapper element. |
| `style` | `React.CSSProperties` | `{}` | Inline CSS styles for the wrapper element. |
| `fitBoundsPadding`| `[number, number]` | `[50, 50]` | Pixel padding when auto-fitting start and end markers. |
| `minZoom` | `number` | `1` | Minimum allowed zoom level. |
| `maxZoom` | `number` | `19` | Maximum allowed zoom level. |
| `tileLayerUrl` | `string` | OpenStreetMap standard | Custom tile layer URL template. |
| `attribution` | `string` | OSM attribution | Custom tile layer attribution string. |
| `onMapReady` | `(mapInstance: L.Map) => void` | `undefined` | Callback fired when the map instance is initialized. |

---

## 🔷 TypeScript Types

The package exports all relevant TypeScript interfaces:

```ts
import type { Coordinates, MapProps, ValidationResult } from 'react-map-sdk';

// Coordinates interface
export interface Coordinates {
  lat: number; // -90 <= lat <= 90
  lng: number; // -180 <= lng <= 180
}
```

You can also use the exported validation utilities directly:

```ts
import { validateCoordinates, isValidLatitude, isValidLongitude } from 'react-map-sdk';

const result = validateCoordinates({ lat: 12.9716, lng: 79.1597 });
console.log(result.isValid); // true
```

---

## 🌐 Next.js & Framework Compatibility

`react-map-sdk` is built to be SSR-safe.

### Next.js App Router (`app/` directory)

Because Leaflet operates on DOM elements in the browser, mark the consuming component as a Client Component:

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
        height="500px"
      />
    </main>
  );
}
```

---

## 💻 Development & Building

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "MAP SDK PACKAGE"
npm install
```

### 2. Build the SDK
```bash
npm run build
```
Generates ESM (`dist/index.mjs`), CJS (`dist/index.js`), and TypeScript declaration files (`dist/index.d.ts`).

### 3. Type Checking
```bash
npm run typecheck
```

### 4. Run the Interactive Demo
```bash
cd example
npm install
npm run dev
```

---

## 🚀 Publishing to npm

### Step 1: Login to npm
```bash
npm login
```

### Step 2: Verify package name availability
Check if `react-map-sdk` is available:
```bash
npm view react-map-sdk
```

> **Note on Naming**: If `react-map-sdk` is already claimed on npm, you can publish it under your own scoped username or organization in `package.json`:
> ```json
> {
>   "name": "@your-username/react-map-sdk"
> }
> ```
> And publish with public access:
> ```bash
> npm publish --access public
> ```

### Step 3: Run the build and publish
```bash
npm run build
npm publish
```

---

## ⚠️ Version 1 Scope & Limitations

Version 1 is intentionally focused on **clean map rendering, start marker, and end marker**.

Version 1 does **NOT** provide:
- ❌ Routing / Turn-by-turn navigation polyline
- ❌ Distance & ETA calculation
- ❌ Forward & Reverse Geocoding
- ❌ Live WebSocket tracking
- ❌ Google Maps / Mapbox providers

---

## 🗺️ Roadmap

- **Version 2**:
  - Routing polyline overlays (OSRM / OpenRouteService integration)
  - Distance and duration estimation
  - Custom marker icons & multiple intermediate waypoint markers
- **Version 3**:
  - Multi-provider architecture (Google Maps, Mapbox, MapLibre)
  - Geocoding & Address search components
- **Version 4**:
  - Real-time GPS tracking & WebSocket updates
  - Animated marker transitions

---

## 📄 License

MIT © 2026
