import React, { useState } from 'react';
import {
  Map,
  AddressSearch,
  reverseGeocode,
  formatDuration,
  type Coordinates,
  type GeocodeResult,
  type RouteInfo,
  type TravelProfile
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
    startName: 'Vellore Fort, Vellore',
    endName: 'Chennai Central, Chennai',
    start: { lat: 12.9202, lng: 79.1325 },
    end: { lat: 13.0827, lng: 80.2707 }
  },
  {
    name: 'Paris → Nice',
    startName: 'Eiffel Tower, Paris',
    endName: 'Promenade des Anglais, Nice',
    start: { lat: 48.8584, lng: 2.2945 },
    end: { lat: 43.6957, lng: 7.2656 }
  },
  {
    name: 'Tokyo → Kyoto',
    startName: 'Tokyo Tower, Tokyo',
    endName: 'Kiyomizu-dera, Kyoto',
    start: { lat: 35.6586, lng: 139.7454 },
    end: { lat: 34.9949, lng: 135.7850 }
  },
  {
    name: 'Rome → Florence',
    startName: 'Colosseum, Rome',
    endName: 'Duomo, Florence',
    start: { lat: 41.8902, lng: 12.4922 },
    end: { lat: 43.7731, lng: 11.2560 }
  },
  {
    name: 'Miami → Key West',
    startName: 'Miami Beach, Florida',
    endName: 'Southernmost Point, Key West',
    start: { lat: 25.7907, lng: -80.1300 },
    end: { lat: 24.5465, lng: -81.7975 }
  },
  {
    name: 'SF → Los Angeles',
    startName: 'Golden Gate Bridge, SF',
    endName: 'Santa Monica Pier, LA',
    start: { lat: 37.8199, lng: -122.4783 },
    end: { lat: 34.0099, lng: -118.4973 }
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
  const [profile, setProfile] = useState<TravelProfile>('car');
  const [routeColor, setRouteColor] = useState<string>('#3b82f6');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Geocoding info from last map click
  const [lastClickedAddress, setLastClickedAddress] = useState<string | null>(null);
  const [isGeocodingClick, setIsGeocodingClick] = useState(false);

  // Map Only Mode State
  const [centerCoords, setCenterCoords] = useState<Coordinates>({ lat: 12.9202, lng: 79.1325 });
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
    setLastClickedAddress(null);
  };

  const handleMapClick = async (coords: Coordinates) => {
    const rounded = {
      lat: parseFloat(coords.lat.toFixed(4)),
      lng: parseFloat(coords.lng.toFixed(4))
    };

    setIsGeocodingClick(true);
    let resolvedName = `Point (${rounded.lat}, ${rounded.lng})`;

    try {
      const geoResult = await reverseGeocode(rounded);
      if (geoResult) {
        resolvedName = geoResult.name || geoResult.displayName.split(',')[0].trim();
        setLastClickedAddress(geoResult.displayName);
      } else {
        setLastClickedAddress(`${rounded.lat}, ${rounded.lng}`);
      }
    } catch {
      setLastClickedAddress(`${rounded.lat}, ${rounded.lng}`);
    } finally {
      setIsGeocodingClick(false);
    }

    if (mode === 'map-only') {
      setCenterCoords(rounded);
    } else if (mode === 'start-only') {
      setStart(rounded);
      setStartName(resolvedName);
      setActivePreset(-1);
    } else if (mode === 'end-only') {
      setEnd(rounded);
      setEndName(resolvedName);
      setActivePreset(-1);
    } else if (mode === 'both') {
      if (clickTarget === 'start') {
        setStart(rounded);
        setStartName(resolvedName);
        setClickTarget('end');
      } else {
        setEnd(rounded);
        setEndName(resolvedName);
        setClickTarget('start');
      }
      setActivePreset(-1);
    }
  };

  const handleStartCoordChange = (lat: number, lng: number) => {
    setStart({ lat, lng });
    setActivePreset(-1);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      reverseGeocode({ lat, lng }).then((res) => {
        if (res) {
          setStartName(res.name || res.displayName.split(',')[0].trim());
          setLastClickedAddress(res.displayName);
        }
      });
    }
  };

  const handleEndCoordChange = (lat: number, lng: number) => {
    setEnd({ lat, lng });
    setActivePreset(-1);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      reverseGeocode({ lat, lng }).then((res) => {
        if (res) {
          setEndName(res.name || res.displayName.split(',')[0].trim());
          setLastClickedAddress(res.displayName);
        }
      });
    }
  };

  const handleStartSelect = (result: GeocodeResult) => {
    setStart(result.coordinates);
    setStartName(result.name || result.displayName.split(',')[0].trim());
    setActivePreset(-1);
  };

  const handleEndSelect = (result: GeocodeResult) => {
    setEnd(result.coordinates);
    setEndName(result.name || result.displayName.split(',')[0].trim());
    setActivePreset(-1);
  };

  const handleCenterSelect = (result: GeocodeResult) => {
    setCenterCoords(result.coordinates);
    setLastClickedAddress(result.displayName);
  };

  const handleProfileChange = (newProfile: TravelProfile) => {
    setProfile(newProfile);
    if (routeInfo) {
      const norm = newProfile === 'walking' ? 'walking' : (newProfile === 'bike' || newProfile === 'cycling') ? 'bike' : 'car';
      let durationSeconds = routeInfo.durationSeconds;
      if (norm === 'walking') {
        durationSeconds = Math.round(routeInfo.distanceMeters / 1.333);
      } else if (norm === 'bike') {
        durationSeconds = Math.round(routeInfo.distanceMeters / 5.0);
      } else {
        durationSeconds = Math.round((routeInfo.distanceKm / 60) * 3600);
      }
      setRouteInfo({
        ...routeInfo,
        profile: newProfile,
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60),
        durationFormatted: formatDuration(durationSeconds)
      });
    }
  };

  const getProfileIcon = (p: TravelProfile) => {
    if (p === 'walking') return '🚶';
    if (p === 'bike' || p === 'cycling') return '🏍️';
    return '🚗';
  };

  const handleSwapPoints = () => {
    const prevStart = start;
    const prevStartName = startName;
    setStart(end);
    setStartName(endName);
    setEnd(prevStart);
    setEndName(prevStartName);
    setActivePreset(-1);
  };

  const getCodeSnippet = () => {
    if (mode === 'map-only') {
      return `import { Map, AddressSearch } from 'react-map-sdk';\n\nexport function MyMap() {\n  return (\n    <div>\n      <AddressSearch onSelect={(res) => console.log(res.coordinates)} />\n      <Map\n        center={{ lat: ${centerCoords.lat}, lng: ${centerCoords.lng} }}\n        zoom={${zoom}}\n        height="520px"\n      />\n    </div>\n  );\n}`;
    }
    if (mode === 'start-only') {
      return `import { Map } from 'react-map-sdk';\n\nexport function OriginMap() {\n  return (\n    <Map\n      start={{ lat: ${start.lat}, lng: ${start.lng} }}\n      startName="${startName}"\n      height="520px"\n    />\n  );\n}`;
    }
    if (mode === 'end-only') {
      return `import { Map } from 'react-map-sdk';\n\nexport function DestinationMap() {\n  return (\n    <Map\n      end={{ lat: ${end.lat}, lng: ${end.lng} }}\n      endName="${endName}"\n      height="520px"\n    />\n  );\n}`;
    }
    return `import { Map, AddressSearch, type RouteInfo } from 'react-map-sdk';\n\nexport function RouteOverview() {\n  return (\n    <Map\n      start={{ lat: ${start.lat}, lng: ${start.lng} }}\n      startName="${startName}"\n      end={{ lat: ${end.lat}, lng: ${end.lng} }}\n      endName="${endName}"\n      routing={${routing}}\n      routingProfile="${profile}"\n      routeColor="${routeColor}"\n      onRouteCalculated={(info: RouteInfo) => {\n        console.log('Distance:', info.distanceKm, 'km');\n        console.log('ETA:', info.durationFormatted);\n      }}\n      height="520px"\n    />\n  );\n}`;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="free-badge">100% Free & Zero Keys</span>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="segmented-nav">
        <button
          className={`seg-btn ${mode === 'map-only' ? 'active' : ''}`}
          onClick={() => setMode('map-only')}
        >
          Map & Search
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
          Route, ETA & Geocoding
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
            {mode === 'map-only' && `Zoom ${zoom} • Click to reverse geocode`}
            {mode === 'start-only' && `${startName}`}
            {mode === 'end-only' && `${endName}`}
            {mode === 'both' &&
              (routeInfo
                ? `${startName} → ${endName} • ${getProfileIcon(profile)} ${routeInfo.durationFormatted} (${routeInfo.distanceKm} km)`
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

      {/* Reverse Geocode Info Toast/Banner */}
      {lastClickedAddress && (
        <div className="reverse-geocode-banner">
          <span style={{ fontSize: '1.1rem' }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>
              {isGeocodingClick ? 'Reverse Geocoding...' : 'Reverse Geocoded Location'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#0c4a6e', fontWeight: 500 }}>
              {lastClickedAddress}
            </div>
          </div>
          <button
            onClick={() => setLastClickedAddress(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Minimal Unified Controls */}
      <div className="control-grid">
        {mode === 'map-only' ? (
          <div className="sub-card">
            <div className="card-title-row">
              <span className="card-title-text">Search Address or Center</span>
            </div>
            <div className="field-group" style={{ marginBottom: '1rem' }}>
              <label>Address Autocomplete (Zero-key Geocoding)</label>
              <AddressSearch
                placeholder="Search any landmark, city, or address..."
                onSelect={handleCenterSelect}
              />
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
                    <label>Search Address (Geocoding)</label>
                    <AddressSearch
                      placeholder="Search origin address or landmark..."
                      onSelect={handleStartSelect}
                      initialValue={startName}
                    />
                  </div>
                  <div className="coords-row field-group">
                    <div>
                      <label>Lat</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="field-input"
                        value={start.lat}
                        onChange={(e) => handleStartCoordChange(parseFloat(e.target.value) || 0, start.lng)}
                      />
                    </div>
                    <div>
                      <label>Lng</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="field-input"
                        value={start.lng}
                        onChange={(e) => handleStartCoordChange(start.lat, parseFloat(e.target.value) || 0)}
                      />
                    </div>
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
                    <label>Search Address (Geocoding)</label>
                    <AddressSearch
                      placeholder="Search destination address or landmark..."
                      onSelect={handleEndSelect}
                      initialValue={endName}
                    />
                  </div>
                  <div className="coords-row field-group">
                    <div>
                      <label>Lat</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="field-input"
                        value={end.lat}
                        onChange={(e) => handleEndCoordChange(parseFloat(e.target.value) || 0, end.lng)}
                      />
                    </div>
                    <div>
                      <label>Lng</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="field-input"
                        value={end.lng}
                        onChange={(e) => handleEndCoordChange(end.lat, parseFloat(e.target.value) || 0)}
                      />
                    </div>
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

                {/* Travel Profile Selector (Placed at top of panel) */}
                <div className="profile-btn-group">
                  <button
                    className={`profile-btn ${profile === 'car' || profile === 'driving' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('car')}
                  >
                    🚗 Car
                  </button>
                  <button
                    className={`profile-btn ${profile === 'bike' || profile === 'cycling' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('bike')}
                  >
                    🏍️ Bike
                  </button>
                  <button
                    className={`profile-btn ${profile === 'walking' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('walking')}
                  >
                    🚶 Walking
                  </button>
                </div>

                {/* Unroutable / Fallback Alert Badge */}
                {routeInfo?.isFallback && (
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    marginBottom: '0.85rem',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>✈️</span>
                    <div>
                      <b>Direct Great-Circle Path:</b> No continuous overland road route exists between these locations (e.g. crossing oceans or non-routable terrain).
                    </div>
                  </div>
                )}

                {/* ETA Metric Widget */}
                {routeInfo && (() => {
                  const arrivalDate = new Date(Date.now() + routeInfo.durationSeconds * 1000);
                  const now = new Date();
                  const totalDays = Math.floor(routeInfo.durationSeconds / 86400);
                  const timeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  let arrivalLabel = '';
                  if (totalDays === 0) {
                    arrivalLabel = arrivalDate.getDate() === now.getDate() ? `Today, ${timeStr}` : `Tomorrow, ${timeStr}`;
                  } else if (totalDays === 1) {
                    arrivalLabel = `Tomorrow, ${timeStr} (+1d)`;
                  } else {
                    const dayName = arrivalDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                    arrivalLabel = `${dayName}, ${timeStr} (+${totalDays}d)`;
                  }

                  return (
                    <div className="eta-metric-box">
                      <div>
                        <div className="eta-item-label">ETA / Duration</div>
                        <div className="eta-item-value">{routeInfo.durationFormatted}</div>
                      </div>
                      <div>
                        <div className="eta-item-label">Distance</div>
                        <div className="eta-item-value">{routeInfo.distanceKm} km</div>
                      </div>
                      <div>
                        <div className="eta-item-label">Arrival Date & Time</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a8a' }}>
                          ~ {arrivalLabel}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Settings Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
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

                {/* Route Summary & Quick Actions */}
                {routeInfo && (
                  <div className="route-insights-card">
                    <div className="route-insight-row">
                      <span className="route-insight-label">
                        <span>🟢</span> From
                      </span>
                      <span className="route-insight-val" title={startName}>
                        {startName.split(',')[0]}
                      </span>
                    </div>

                    <div className="route-insight-row">
                      <span className="route-insight-label">
                        <span>🏁</span> To
                      </span>
                      <span className="route-insight-val" title={endName}>
                        {endName.split(',')[0]}
                      </span>
                    </div>

                    <button className="btn-swap" onClick={handleSwapPoints}>
                      <span>⇄</span> Swap Origin & Destination
                    </button>
                  </div>
                )}
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
