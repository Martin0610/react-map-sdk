import React, { useState } from 'react';
import {
  Map,
  type Coordinates,
  type RouteInfo,
  isValidLatitude,
  isValidLongitude
} from 'react-map-sdk';
import './App.css';

type Mode = 'map-only' | 'start-only' | 'end-only' | 'both';

interface TourismPreset {
  name: string;
  emoji: string;
  region: string;
  startName: string;
  endName: string;
  start: Coordinates;
  end: Coordinates;
}

const TOURISM_PRESETS: TourismPreset[] = [
  {
    name: 'Vellore → Chennai',
    emoji: '🛕',
    region: 'NH48 Expressway',
    startName: 'Vellore',
    endName: 'Chennai',
    start: { lat: 12.9716, lng: 79.1597 },
    end: { lat: 13.0827, lng: 80.2707 }
  },
  {
    name: 'Paris → Nice',
    emoji: '🗼',
    region: 'A6 / A7 Autoroute du Soleil',
    startName: 'Paris',
    endName: 'Nice',
    start: { lat: 48.8566, lng: 2.3522 },
    end: { lat: 43.7102, lng: 7.262 }
  },
  {
    name: 'Tokyo → Kyoto',
    emoji: '⛩️',
    region: 'Tomei Expressway',
    startName: 'Tokyo',
    endName: 'Kyoto',
    start: { lat: 35.6762, lng: 139.6503 },
    end: { lat: 35.0116, lng: 135.7681 }
  },
  {
    name: 'Rome → Florence',
    emoji: '🏛️',
    region: 'Autostrada A1',
    startName: 'Rome',
    endName: 'Florence',
    start: { lat: 41.9028, lng: 12.4964 },
    end: { lat: 43.7696, lng: 11.2558 }
  },
  {
    name: 'Miami → Key West',
    emoji: '🏖️',
    region: 'Overseas Highway',
    startName: 'Miami',
    endName: 'Key West',
    start: { lat: 25.7617, lng: -80.1918 },
    end: { lat: 24.5551, lng: -81.78 }
  },
  {
    name: 'SF → Los Angeles',
    emoji: '🌉',
    region: 'Pacific Coast Highway',
    startName: 'San Francisco',
    endName: 'Los Angeles',
    start: { lat: 37.7749, lng: -122.4194 },
    end: { lat: 34.0522, lng: -118.2437 }
  }
];

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('both');
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0); // Default to Vellore -> Chennai
  const [copied, setCopied] = useState(false);

  // Click placement mode in Start+End mode ('start' or 'end')
  const [clickTarget, setClickTarget] = useState<'start' | 'end'>('start');

  // Location Names
  const [startLocationName, setStartLocationName] = useState<string>(TOURISM_PRESETS[0].startName);
  const [endLocationName, setEndLocationName] = useState<string>(TOURISM_PRESETS[0].endName);

  // Road Routing settings
  const [enableRoadRouting, setEnableRoadRouting] = useState<boolean>(true);
  const [travelProfile, setTravelProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [routeColor, setRouteColor] = useState<string>('#3b82f6');
  const [calculatedRoute, setCalculatedRoute] = useState<RouteInfo | null>(null);

  // Fallback straight line customizer
  const [lineStyle, setLineStyle] = useState<'dashed' | 'solid'>('dashed');

  // Map Only Mode States
  const [centerCoords, setCenterCoords] = useState<Coordinates>({ lat: 12.9716, lng: 79.1597 });
  const [zoomLevel, setZoomLevel] = useState<number>(10);

  // Start & End Coordinates (defaults to Vellore -> Chennai)
  const [startPoint, setStartPoint] = useState<Coordinates>(TOURISM_PRESETS[0].start);
  const [endPoint, setEndPoint] = useState<Coordinates>(TOURISM_PRESETS[0].end);

  const applyPreset = (index: number) => {
    setActivePresetIndex(index);
    const preset = TOURISM_PRESETS[index];
    setStartPoint(preset.start);
    setEndPoint(preset.end);
    setStartLocationName(preset.startName);
    setEndLocationName(preset.endName);
    setCenterCoords(preset.start);
  };

  const handleMapClick = (coords: Coordinates) => {
    const rounded = {
      lat: parseFloat(coords.lat.toFixed(4)),
      lng: parseFloat(coords.lng.toFixed(4))
    };

    if (activeMode === 'map-only') {
      setCenterCoords(rounded);
    } else if (activeMode === 'start-only') {
      setStartPoint(rounded);
      setStartLocationName(`Custom (${rounded.lat}, ${rounded.lng})`);
      setActivePresetIndex(-1);
    } else if (activeMode === 'end-only') {
      setEndPoint(rounded);
      setEndLocationName(`Custom (${rounded.lat}, ${rounded.lng})`);
      setActivePresetIndex(-1);
    } else if (activeMode === 'both') {
      if (clickTarget === 'start') {
        setStartPoint(rounded);
        setStartLocationName(`Custom (${rounded.lat}, ${rounded.lng})`);
        setClickTarget('end');
      } else {
        setEndPoint(rounded);
        setEndLocationName(`Custom (${rounded.lat}, ${rounded.lng})`);
        setClickTarget('start');
      }
      setActivePresetIndex(-1);
    }
  };

  const isStartValid = isValidLatitude(startPoint.lat) && isValidLongitude(startPoint.lng);
  const isEndValid = isValidLatitude(endPoint.lat) && isValidLongitude(endPoint.lng);
  const isCenterValid = isValidLatitude(centerCoords.lat) && isValidLongitude(centerCoords.lng);

  const getCodeSnippet = () => {
    switch (activeMode) {
      case 'map-only':
        return `import { Map } from "react-map-sdk";

export function TravelMap() {
  return (
    <Map
      center={{ lat: ${centerCoords.lat}, lng: ${centerCoords.lng} }}
      zoom={${zoomLevel}}
      height="520px"
    />
  );
}`;
      case 'start-only':
        return `import { Map } from "react-map-sdk";

export function TravelMap() {
  return (
    <Map
      start={{
        lat: ${startPoint.lat},
        lng: ${startPoint.lng}
      }}
      startName="${startLocationName}"
      height="520px"
    />
  );
}`;
      case 'end-only':
        return `import { Map } from "react-map-sdk";

export function TravelMap() {
  return (
    <Map
      end={{
        lat: ${endPoint.lat},
        lng: ${endPoint.lng}
      }}
      endName="${endLocationName}"
      height="520px"
    />
  );
}`;
      case 'both':
      default:
        return `import { Map } from "react-map-sdk";

export function TravelMap() {
  return (
    <Map
      start={{
        lat: ${startPoint.lat},
        lng: ${startPoint.lng}
      }}
      startName="${startLocationName}"
      end={{
        lat: ${endPoint.lat},
        lng: ${endPoint.lng}
      }}
      endName="${endLocationName}"
      routing={${enableRoadRouting}}
      routingProfile="${travelProfile}"
      routeColor="${routeColor}"
      height="520px"
    />
  );
}`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="travel-app">
      {/* Minimalist Top Navbar */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-icon">🗺️</div>
          <div>
            <h1 className="brand-title">React Map SDK</h1>
          </div>
        </div>
      </header>

      {/* Segmented Mode Bar */}
      <div className="mode-segmented-bar">
        <button
          className={`segment-btn ${activeMode === 'map-only' ? 'active' : ''}`}
          onClick={() => setActiveMode('map-only')}
        >
          🗺️ 1. Map View
        </button>
        <button
          className={`segment-btn ${activeMode === 'start-only' ? 'active' : ''}`}
          onClick={() => setActiveMode('start-only')}
        >
          🟢 2. Starting Point (A)
        </button>
        <button
          className={`segment-btn ${activeMode === 'end-only' ? 'active' : ''}`}
          onClick={() => setActiveMode('end-only')}
        >
          🔴 3. Destination Point (B)
        </button>
        <button
          className={`segment-btn ${activeMode === 'both' ? 'active' : ''}`}
          onClick={() => setActiveMode('both')}
        >
          🛣️ 4. Route & ETA
        </button>
      </div>

      {/* Tourism Destination Presets */}
      <div className="presets-section">
        <span className="presets-label">Popular Routes:</span>
        {TOURISM_PRESETS.map((preset, index) => (
          <button
            key={preset.name}
            className={`preset-chip ${activePresetIndex === index ? 'active' : ''}`}
            onClick={() => applyPreset(index)}
          >
            <span>{preset.emoji}</span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main Map Frame */}
      <div className="map-canvas-card">
        <div className="map-top-overlay">
          <span className="status-dot"></span>
          <span>
            {activeMode === 'map-only' && `Map View • Click map to re-center`}
            {activeMode === 'start-only' && `Origin: ${startLocationName} (${startPoint.lat.toFixed(2)}, ${startPoint.lng.toFixed(2)})`}
            {activeMode === 'end-only' && `Destination: ${endLocationName} (${endPoint.lat.toFixed(2)}, ${endPoint.lng.toFixed(2)})`}
            {activeMode === 'both' &&
              (calculatedRoute
                ? `${startLocationName} → ${endLocationName} • ${calculatedRoute.profile === 'driving' ? '🚗' : calculatedRoute.profile === 'walking' ? '🚶' : '🚴'} ${calculatedRoute.distanceKm} km • ${calculatedRoute.durationFormatted}`
                : `Next Click sets: ${clickTarget === 'start' ? '📍 Origin (A)' : '🏁 Destination (B)'}`)}
          </span>
        </div>

        {activeMode === 'map-only' && (
          <Map
            center={centerCoords}
            zoom={zoomLevel}
            onClick={handleMapClick}
            height="520px"
          />
        )}

        {activeMode === 'start-only' && (
          <Map
            start={startPoint}
            startName={startLocationName}
            onClick={handleMapClick}
            height="520px"
          />
        )}

        {activeMode === 'end-only' && (
          <Map
            end={endPoint}
            endName={endLocationName}
            onClick={handleMapClick}
            height="520px"
          />
        )}

        {activeMode === 'both' && (
          <Map
            start={startPoint}
            startName={startLocationName}
            end={endPoint}
            endName={endLocationName}
            routing={enableRoadRouting}
            routingProfile={travelProfile}
            routeColor={routeColor}
            lineStyle={lineStyle}
            onRouteCalculated={(info) => setCalculatedRoute(info)}
            onClick={handleMapClick}
            height="520px"
          />
        )}
      </div>

      {/* Controls & Coordinates Panel */}
      <div className="dashboard-grid">
        {activeMode === 'map-only' ? (
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <span>🌐</span>
                <span>Map Center & Zoom</span>
              </div>
              <span className="panel-badge-emerald">Live Control</span>
            </div>

            <div className="input-row-grid">
              <div className="input-box">
                <label>Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerCoords.lat}
                  onChange={(e) => {
                    setCenterCoords((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }));
                    setActivePresetIndex(-1);
                  }}
                />
              </div>
              <div className="input-box">
                <label>Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerCoords.lng}
                  onChange={(e) => {
                    setCenterCoords((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }));
                    setActivePresetIndex(-1);
                  }}
                />
              </div>
            </div>

            <div className="input-box" style={{ marginTop: '0.75rem' }}>
              <label>Zoom Level ({zoomLevel})</label>
              <div className="zoom-slider-container">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>2</span>
                <input
                  type="range"
                  min="2"
                  max="18"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                  className="zoom-slider"
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>18</span>
              </div>
            </div>

            <div className={`val-status ${isCenterValid ? 'val-valid' : 'val-invalid'}`}>
              {isCenterValid ? '✓ Click map or type custom coordinates' : '⚠️ Latitude must be [-90, 90], Longitude [-180, 180]'}
            </div>
          </div>
        ) : (
          <>
            {(activeMode === 'start-only' || activeMode === 'both') && (
              <div className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <span style={{ color: '#059669', fontSize: '1.1rem' }}>📍</span>
                    <span>Origin (A): {startLocationName}</span>
                  </div>
                  {activeMode === 'both' && (
                    <button
                      onClick={() => setClickTarget('start')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #059669',
                        background: clickTarget === 'start' ? '#059669' : '#ecfdf5',
                        color: clickTarget === 'start' ? '#ffffff' : '#059669',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {clickTarget === 'start' ? '🎯 Click Target' : 'Set Target'}
                    </button>
                  )}
                </div>

                <div className="input-box" style={{ marginBottom: '0.65rem' }}>
                  <label>Location / City Name</label>
                  <input
                    type="text"
                    value={startLocationName}
                    placeholder="e.g. Vellore"
                    onChange={(e) => setStartLocationName(e.target.value)}
                  />
                </div>

                <div className="input-row-grid">
                  <div className="input-box">
                    <label>Latitude (-90 to 90)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={startPoint.lat}
                      onChange={(e) => {
                        setStartPoint((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }));
                        setActivePresetIndex(-1);
                      }}
                    />
                  </div>
                  <div className="input-box">
                    <label>Longitude (-180 to 180)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={startPoint.lng}
                      onChange={(e) => {
                        setStartPoint((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }));
                        setActivePresetIndex(-1);
                      }}
                    />
                  </div>
                </div>

                <div className={`val-status ${isStartValid ? 'val-valid' : 'val-invalid'}`}>
                  {isStartValid ? '✓ Click map or type custom coordinates' : '⚠️ Invalid latitude or longitude range'}
                </div>
              </div>
            )}

            {(activeMode === 'end-only' || activeMode === 'both') && (
              <div className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <span style={{ color: '#e11d48', fontSize: '1.1rem' }}>🏁</span>
                    <span>Destination (B): {endLocationName}</span>
                  </div>
                  {activeMode === 'both' && (
                    <button
                      onClick={() => setClickTarget('end')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e11d48',
                        background: clickTarget === 'end' ? '#e11d48' : '#fff1f2',
                        color: clickTarget === 'end' ? '#ffffff' : '#e11d48',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {clickTarget === 'end' ? '🎯 Click Target' : 'Set Target'}
                    </button>
                  )}
                </div>

                <div className="input-box" style={{ marginBottom: '0.65rem' }}>
                  <label>Location / City Name</label>
                  <input
                    type="text"
                    value={endLocationName}
                    placeholder="e.g. Chennai"
                    onChange={(e) => setEndLocationName(e.target.value)}
                  />
                </div>

                <div className="input-row-grid">
                  <div className="input-box">
                    <label>Latitude (-90 to 90)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={endPoint.lat}
                      onChange={(e) => {
                        setEndPoint((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }));
                        setActivePresetIndex(-1);
                      }}
                    />
                  </div>
                  <div className="input-box">
                    <label>Longitude (-180 to 180)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={endPoint.lng}
                      onChange={(e) => {
                        setEndPoint((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }));
                        setActivePresetIndex(-1);
                      }}
                    />
                  </div>
                </div>

                <div className={`val-status ${isEndValid ? 'val-valid' : 'val-invalid'}`}>
                  {isEndValid ? '✓ Click map or type custom coordinates' : '⚠️ Invalid latitude or longitude range'}
                </div>
              </div>
            )}

            {activeMode === 'both' && (
              <div className="panel-card">
                <div className="panel-header">
                  <div className="panel-title">
                    <span style={{ color: '#3b82f6', fontSize: '1.1rem' }}>🛣️</span>
                    <span>Route & ETA</span>
                  </div>
                  <span className="panel-badge-emerald">Live ETA</span>
                </div>

                {/* Real-time ETA & Distance Metrics Box */}
                {calculatedRoute && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                        ESTIMATED TIME (ETA)
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>
                        {calculatedRoute.durationFormatted}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                        TOTAL DISTANCE
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1d4ed8' }}>
                        {calculatedRoute.distanceKm} km
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                        EST. ARRIVAL
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb' }}>
                        ~ {new Date(Date.now() + calculatedRoute.durationSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Travel Profile Selector */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <button
                    onClick={() => setTravelProfile('driving')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: travelProfile === 'driving' ? '#2563eb' : '#f8fafc',
                      color: travelProfile === 'driving' ? '#ffffff' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🚗 Driving
                  </button>
                  <button
                    onClick={() => setTravelProfile('walking')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: travelProfile === 'walking' ? '#2563eb' : '#f8fafc',
                      color: travelProfile === 'walking' ? '#ffffff' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🚶 Walking
                  </button>
                  <button
                    onClick={() => setTravelProfile('cycling')}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: travelProfile === 'cycling' ? '#2563eb' : '#f8fafc',
                      color: travelProfile === 'cycling' ? '#ffffff' : '#334155',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🚴 Cycling
                  </button>
                </div>

                <div className="input-row-grid">
                  <div className="input-box">
                    <label>Route Color</label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={routeColor}
                        onChange={(e) => setRouteColor(e.target.value)}
                        style={{ width: '38px', height: '34px', padding: '0', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{routeColor}</span>
                    </div>
                  </div>

                  <div className="input-box">
                    <label>Straight Line Fallback</label>
                    <select
                      value={lineStyle}
                      onChange={(e) => setLineStyle(e.target.value as 'dashed' | 'solid')}
                      style={{
                        padding: '0.5rem 0.65rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="dashed">Dashed Line</option>
                      <option value="solid">Solid Line</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.825rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={enableRoadRouting}
                      onChange={(e) => setEnableRoadRouting(e.target.checked)}
                      style={{ accentColor: '#2563eb' }}
                    />
                    Enable turn-by-turn road route
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Code Snippet Box */}
      <div className="code-preview-card">
        <div className="code-header">
          <span className="code-header-title">React Integration Code</span>
          <button className="copy-btn" onClick={handleCopyCode}>
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>
        <pre className="code-pre">{getCodeSnippet()}</pre>
      </div>
    </div>
  );
};
