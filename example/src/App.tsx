import React, { useState } from 'react';
import {
  Map,
  type Coordinates,
  type RouteInfo
} from 'react-map-sdk';
import './App.css';

type Mode = 'map-only' | 'start-only' | 'end-only' | 'both';

interface RoutePreset {
  name: string;
  startName: string;
  endName: string;
  start: Coordinates;
  end: Coordinates;
}

const PRESETS: RoutePreset[] = [
  {
    name: 'Vellore → Chennai',
    startName: 'Vellore',
    endName: 'Chennai',
    start: { lat: 12.9716, lng: 79.1597 },
    end: { lat: 13.0827, lng: 80.2707 }
  },
  {
    name: 'Paris → Nice',
    startName: 'Paris',
    endName: 'Nice',
    start: { lat: 48.8566, lng: 2.3522 },
    end: { lat: 43.7102, lng: 7.262 }
  },
  {
    name: 'Tokyo → Kyoto',
    startName: 'Tokyo',
    endName: 'Kyoto',
    start: { lat: 35.6762, lng: 139.6503 },
    end: { lat: 35.0116, lng: 135.7681 }
  },
  {
    name: 'Rome → Florence',
    startName: 'Rome',
    endName: 'Florence',
    start: { lat: 41.9028, lng: 12.4964 },
    end: { lat: 43.7696, lng: 11.2558 }
  },
  {
    name: 'Miami → Key West',
    startName: 'Miami',
    endName: 'Key West',
    start: { lat: 25.7617, lng: -80.1918 },
    end: { lat: 24.5551, lng: -81.78 }
  },
  {
    name: 'SF → Los Angeles',
    startName: 'San Francisco',
    endName: 'Los Angeles',
    start: { lat: 37.7749, lng: -122.4194 },
    end: { lat: 34.0522, lng: -118.2437 }
  }
];

export const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('both');
  const [activePreset, setActivePreset] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Target indicator when clicking on map ('start' or 'end')
  const [clickTarget, setClickTarget] = useState<'start' | 'end'>('start');

  // Location Names
  const [startName, setStartName] = useState<string>(PRESETS[0].startName);
  const [endName, setEndName] = useState<string>(PRESETS[0].endName);

  // Routing settings
  const [routing, setRouting] = useState<boolean>(true);
  const [profile, setProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [routeColor, setRouteColor] = useState<string>('#3b82f6');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Map Only Mode State
  const [centerCoords, setCenterCoords] = useState<Coordinates>({ lat: 12.9716, lng: 79.1597 });
  const [zoom, setZoom] = useState<number>(10);

  // Start & End Coordinates
  const [start, setStart] = useState<Coordinates>(PRESETS[0].start);
  const [end, setEnd] = useState<Coordinates>(PRESETS[0].end);

  const applyPreset = (index: number) => {
    setActivePreset(index);
    const p = PRESETS[index];
    setStart(p.start);
    setEnd(p.end);
    setStartName(p.startName);
    setEndName(p.endName);
    setCenterCoords(p.start);
  };

  const handleMapClick = (coords: Coordinates) => {
    const rounded = {
      lat: parseFloat(coords.lat.toFixed(4)),
      lng: parseFloat(coords.lng.toFixed(4))
    };

    if (mode === 'map-only') {
      setCenterCoords(rounded);
    } else if (mode === 'start-only') {
      setStart(rounded);
      setStartName(`Point (${rounded.lat}, ${rounded.lng})`);
      setActivePreset(-1);
    } else if (mode === 'end-only') {
      setEnd(rounded);
      setEndName(`Point (${rounded.lat}, ${rounded.lng})`);
      setActivePreset(-1);
    } else if (mode === 'both') {
      if (clickTarget === 'start') {
        setStart(rounded);
        setStartName(`Point (${rounded.lat}, ${rounded.lng})`);
        setClickTarget('end');
      } else {
        setEnd(rounded);
        setEndName(`Point (${rounded.lat}, ${rounded.lng})`);
        setClickTarget('start');
      }
      setActivePreset(-1);
    }
  };

  const getCodeSnippet = () => {
    if (mode === 'map-only') {
      return `<Map center={{ lat: ${centerCoords.lat}, lng: ${centerCoords.lng} }} zoom={${zoom}} height="520px" />`;
    }
    if (mode === 'start-only') {
      return `<Map start={{ lat: ${start.lat}, lng: ${start.lng} }} startName="${startName}" height="520px" />`;
    }
    if (mode === 'end-only') {
      return `<Map end={{ lat: ${end.lat}, lng: ${end.lng} }} endName="${endName}" height="520px" />`;
    }
    return `<Map\n  start={{ lat: ${start.lat}, lng: ${start.lng} }}\n  startName="${startName}"\n  end={{ lat: ${end.lat}, lng: ${end.lng} }}\n  endName="${endName}"\n  routing={${routing}}\n  routingProfile="${profile}"\n  routeColor="${routeColor}"\n  height="520px"\n/>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="minimal-app">
      {/* Top Header */}
      <header className="top-header">
        <div className="brand-title">
          <span>🗺️</span>
          <span>React Map SDK</span>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="segmented-nav">
        <button
          className={`seg-btn ${mode === 'map-only' ? 'active' : ''}`}
          onClick={() => setMode('map-only')}
        >
          Map
        </button>
        <button
          className={`seg-btn ${mode === 'start-only' ? 'active' : ''}`}
          onClick={() => setMode('start-only')}
        >
          Origin (A)
        </button>
        <button
          className={`seg-btn ${mode === 'end-only' ? 'active' : ''}`}
          onClick={() => setMode('end-only')}
        >
          Destination (B)
        </button>
        <button
          className={`seg-btn ${mode === 'both' ? 'active' : ''}`}
          onClick={() => setMode('both')}
        >
          Route & ETA
        </button>
      </div>

      {/* Preset Quick Chips */}
      <div className="presets-bar">
        {PRESETS.map((p, idx) => (
          <button
            key={p.name}
            className={`preset-chip-btn ${activePreset === idx ? 'active' : ''}`}
            onClick={() => applyPreset(idx)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Map Card */}
      <div className="map-frame-card">
        <div className="map-floating-overlay">
          <span className="status-dot"></span>
          <span>
            {mode === 'map-only' && `Zoom ${zoom} • Click to center`}
            {mode === 'start-only' && `${startName}`}
            {mode === 'end-only' && `${endName}`}
            {mode === 'both' &&
              (routeInfo
                ? `${startName} → ${endName} • ${profile === 'driving' ? '🚗' : profile === 'walking' ? '🚶' : '🚴'} ${routeInfo.durationFormatted} (${routeInfo.distanceKm} km)`
                : `Next click sets ${clickTarget === 'start' ? 'Origin' : 'Destination'}`)}
          </span>
        </div>

        {mode === 'map-only' && (
          <Map center={centerCoords} zoom={zoom} onClick={handleMapClick} height="520px" />
        )}
        {mode === 'start-only' && (
          <Map start={start} startName={startName} onClick={handleMapClick} height="520px" />
        )}
        {mode === 'end-only' && (
          <Map end={end} endName={endName} onClick={handleMapClick} height="520px" />
        )}
        {mode === 'both' && (
          <Map
            start={start}
            startName={startName}
            end={end}
            endName={endName}
            routing={routing}
            routingProfile={profile}
            routeColor={routeColor}
            onRouteCalculated={(info) => setRouteInfo(info)}
            onClick={handleMapClick}
            height="520px"
          />
        )}
      </div>

      {/* Minimal Unified Controls */}
      <div className="control-grid">
        {mode === 'map-only' ? (
          <div className="sub-card">
            <div className="card-title-row">
              <span className="card-title-text">Center & Zoom</span>
            </div>
            <div className="coords-row field-group">
              <div>
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  className="field-input"
                  value={centerCoords.lat}
                  onChange={(e) => setCenterCoords((c) => ({ ...c, lat: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  className="field-input"
                  value={centerCoords.lng}
                  onChange={(e) => setCenterCoords((c) => ({ ...c, lng: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="field-group">
              <label>Zoom ({zoom})</label>
              <input
                type="range"
                min="2"
                max="18"
                style={{ width: '100%', accentColor: '#2563eb' }}
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Origin & Destination Card */}
            <div className="sub-card">
              {(mode === 'start-only' || mode === 'both') && (
                <div style={{ marginBottom: mode === 'both' ? '1.25rem' : '0' }}>
                  <div className="card-title-row">
                    <span className="card-title-text" style={{ color: '#059669' }}>
                      📍 Origin (A)
                    </span>
                    {mode === 'both' && (
                      <button
                        className="target-badge-btn target-badge-emerald"
                        onClick={() => setClickTarget('start')}
                      >
                        {clickTarget === 'start' ? '🎯 Active Click Target' : 'Set Click Target'}
                      </button>
                    )}
                  </div>
                  <div className="field-group">
                    <input
                      type="text"
                      className="field-input"
                      value={startName}
                      placeholder="Origin Name"
                      onChange={(e) => setStartName(e.target.value)}
                    />
                  </div>
                  <div className="coords-row field-group">
                    <input
                      type="number"
                      step="0.0001"
                      className="field-input"
                      value={start.lat}
                      onChange={(e) => setStart((s) => ({ ...s, lat: parseFloat(e.target.value) || 0 }))}
                    />
                    <input
                      type="number"
                      step="0.0001"
                      className="field-input"
                      value={start.lng}
                      onChange={(e) => setStart((s) => ({ ...s, lng: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}

              {(mode === 'end-only' || mode === 'both') && (
                <div>
                  <div className="card-title-row">
                    <span className="card-title-text" style={{ color: '#e11d48' }}>
                      🏁 Destination (B)
                    </span>
                    {mode === 'both' && (
                      <button
                        className="target-badge-btn target-badge-rose"
                        onClick={() => setClickTarget('end')}
                      >
                        {clickTarget === 'end' ? '🎯 Active Click Target' : 'Set Click Target'}
                      </button>
                    )}
                  </div>
                  <div className="field-group">
                    <input
                      type="text"
                      className="field-input"
                      value={endName}
                      placeholder="Destination Name"
                      onChange={(e) => setEndName(e.target.value)}
                    />
                  </div>
                  <div className="coords-row field-group">
                    <input
                      type="number"
                      step="0.0001"
                      className="field-input"
                      value={end.lat}
                      onChange={(e) => setEnd((s) => ({ ...s, lat: parseFloat(e.target.value) || 0 }))}
                    />
                    <input
                      type="number"
                      step="0.0001"
                      className="field-input"
                      value={end.lng}
                      onChange={(e) => setEnd((s) => ({ ...s, lng: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Route & ETA Panel */}
            {mode === 'both' && (
              <div className="sub-card">
                <div className="card-title-row">
                  <span className="card-title-text">Route & ETA</span>
                </div>

                {/* ETA Metric Widget */}
                {routeInfo && (
                  <div className="eta-metric-box">
                    <div>
                      <div className="eta-item-label">ETA</div>
                      <div className="eta-item-value">{routeInfo.durationFormatted}</div>
                    </div>
                    <div>
                      <div className="eta-item-label">Distance</div>
                      <div className="eta-item-value">{routeInfo.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="eta-item-label">Arrival</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a8a' }}>
                        ~ {new Date(Date.now() + routeInfo.durationSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Travel Profile Selector */}
                <div className="profile-btn-group">
                  <button
                    className={`profile-btn ${profile === 'driving' ? 'active' : ''}`}
                    onClick={() => setProfile('driving')}
                  >
                    🚗 Driving
                  </button>
                  <button
                    className={`profile-btn ${profile === 'walking' ? 'active' : ''}`}
                    onClick={() => setProfile('walking')}
                  >
                    🚶 Walking
                  </button>
                  <button
                    className={`profile-btn ${profile === 'cycling' ? 'active' : ''}`}
                    onClick={() => setProfile('cycling')}
                  >
                    🚴 Cycling
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={routing}
                      onChange={(e) => setRouting(e.target.checked)}
                      style={{ accentColor: '#2563eb' }}
                    />
                    Road Routing
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="color"
                      value={routeColor}
                      onChange={(e) => setRouteColor(e.target.value)}
                      style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Minimal Collapsible Code View */}
      <div className="code-accordion">
        <div className="code-accordion-header">
          <span className="code-title">React Component Code</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-copy" onClick={() => setShowCode(!showCode)}>
              {showCode ? 'Hide Code' : 'View Code'}
            </button>
            <button className="btn-copy" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy JSX'}
            </button>
          </div>
        </div>
        {showCode && <pre className="code-body">{getCodeSnippet()}</pre>}
      </div>
    </div>
  );
};
