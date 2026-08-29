import React, { useState } from 'react';
import { Map, type Coordinates, isValidLatitude, isValidLongitude } from 'react-map-sdk';
import './App.css';

type Mode = 'map-only' | 'start-only' | 'end-only' | 'both';

interface TourismPreset {
  name: string;
  emoji: string;
  region: string;
  start: Coordinates;
  end: Coordinates;
}

const TOURISM_PRESETS: TourismPreset[] = [
  {
    name: 'Paris → Nice',
    emoji: '🗼',
    region: 'French Riviera',
    start: { lat: 48.8566, lng: 2.3522 },
    end: { lat: 43.7102, lng: 7.262 }
  },
  {
    name: 'Tokyo → Kyoto',
    emoji: '⛩️',
    region: 'Japan Golden Route',
    start: { lat: 35.6762, lng: 139.6503 },
    end: { lat: 35.0116, lng: 135.7681 }
  },
  {
    name: 'Rome → Florence',
    emoji: '🏛️',
    region: 'Tuscan Tour',
    start: { lat: 41.9028, lng: 12.4964 },
    end: { lat: 43.7696, lng: 11.2558 }
  },
  {
    name: 'Miami → Key West',
    emoji: '🏖️',
    region: 'Overseas Highway',
    start: { lat: 25.7617, lng: -80.1918 },
    end: { lat: 24.5551, lng: -81.78 }
  },
  {
    name: 'Vellore → Chennai',
    emoji: '🛕',
    region: 'Tamil Nadu Heritage',
    start: { lat: 12.9716, lng: 79.1597 },
    end: { lat: 13.0827, lng: 80.2707 }
  },
  {
    name: 'SF → Los Angeles',
    emoji: '🌉',
    region: 'Pacific Coast',
    start: { lat: 37.7749, lng: -122.4194 },
    end: { lat: 34.0522, lng: -118.2437 }
  }
];

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('both');
  const [activePresetIndex, setActivePresetIndex] = useState<number>(4); // Default to Vellore -> Chennai
  const [copied, setCopied] = useState(false);

  // Click placement mode in Start+End mode ('start' or 'end')
  const [clickTarget, setClickTarget] = useState<'start' | 'end'>('start');

  // Line customizer states
  const [showConnectingLine, setShowConnectingLine] = useState<boolean>(true);
  const [lineColor, setLineColor] = useState<string>('#2563eb');
  const [lineStyle, setLineStyle] = useState<'dashed' | 'solid'>('dashed');

  // Map Only Mode States
  const [centerCoords, setCenterCoords] = useState<Coordinates>({ lat: 12.9716, lng: 79.1597 });
  const [zoomLevel, setZoomLevel] = useState<number>(10);

  // Start & End Coordinates (defaults to Vellore -> Chennai)
  const [startPoint, setStartPoint] = useState<Coordinates>(TOURISM_PRESETS[4].start);
  const [endPoint, setEndPoint] = useState<Coordinates>(TOURISM_PRESETS[4].end);

  const applyPreset = (index: number) => {
    setActivePresetIndex(index);
    const preset = TOURISM_PRESETS[index];
    setStartPoint(preset.start);
    setEndPoint(preset.end);
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
      setActivePresetIndex(-1);
    } else if (activeMode === 'end-only') {
      setEndPoint(rounded);
      setActivePresetIndex(-1);
    } else if (activeMode === 'both') {
      if (clickTarget === 'start') {
        setStartPoint(rounded);
        setClickTarget('end');
      } else {
        setEndPoint(rounded);
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
      end={{
        lat: ${endPoint.lat},
        lng: ${endPoint.lng}
      }}
      showLine={${showConnectingLine}}
      lineColor="${lineColor}"
      lineStyle="${lineStyle}"
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
          📍 4. Start + End Points
        </button>
      </div>

      {/* Tourism Destination Presets */}
      <div className="presets-section">
        <span className="presets-label">Destination Presets:</span>
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
            {activeMode === 'start-only' && `Click map to place Origin Pin (A)`}
            {activeMode === 'end-only' && `Click map to place Destination Pin (B)`}
            {activeMode === 'both' &&
              (activePresetIndex >= 0
                ? `${TOURISM_PRESETS[activePresetIndex].name}`
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
            onClick={handleMapClick}
            height="520px"
          />
        )}

        {activeMode === 'end-only' && (
          <Map
            end={endPoint}
            onClick={handleMapClick}
            height="520px"
          />
        )}

        {activeMode === 'both' && (
          <Map
            start={startPoint}
            end={endPoint}
            showLine={showConnectingLine}
            lineColor={lineColor}
            lineStyle={lineStyle}
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
                    <span>Starting Point (Origin A)</span>
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
                      {clickTarget === 'start' ? '🎯 Click Map Target' : 'Set as Click Target'}
                    </button>
                  )}
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
                    <span>Ending Point (Destination B)</span>
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
                      {clickTarget === 'end' ? '🎯 Click Map Target' : 'Set as Click Target'}
                    </button>
                  )}
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
                    <span style={{ color: '#2563eb', fontSize: '1.1rem' }}>➖</span>
                    <span>Connecting Line Settings</span>
                  </div>
                  <span className="panel-badge-emerald">Line Options</span>
                </div>

                <div className="input-row-grid">
                  <div className="input-box">
                    <label>Line Style</label>
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
                      <option value="dashed">Dashed Flight Line</option>
                      <option value="solid">Solid Direct Line</option>
                    </select>
                  </div>
                  <div className="input-box">
                    <label>Line Color</label>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={lineColor}
                        onChange={(e) => setLineColor(e.target.value)}
                        style={{ width: '38px', height: '34px', padding: '0', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{lineColor}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.825rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={showConnectingLine}
                      onChange={(e) => setShowConnectingLine(e.target.checked)}
                      style={{ accentColor: '#2563eb' }}
                    />
                    Display connecting line on map
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
