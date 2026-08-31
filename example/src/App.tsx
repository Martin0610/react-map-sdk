import React, { useState } from 'react';
import {
  Map,
  AddressSearch,
  reverseGeocode,
  calculateRealisticDuration,
  normalizeTravelProfile,
  formatDuration,
  type Coordinates,
  type GeocodeResult,
  type RouteInfo,
  type TravelProfile
} from 'react-map-sdk';
import {
  Map as MapIcon,
  MapPin,
  Car,
  Bike,
  Footprints,
  Crosshair,
  Flag,
  Plane,
  ArrowLeftRight,
  Code,
  Copy,
  Check,
  X
} from 'lucide-react';
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
  const [centerCoords, setCenterCoords] = useState<Coordinates>(PRESETS[0].start);
  const [zoom, setZoom] = useState<number>(10);

  // Start & End Coordinates
  const [start, setStart] = useState<Coordinates>(PRESETS[0].start);
  const [end, setEnd] = useState<Coordinates>(PRESETS[0].end);

  const handleStartDragEnd = async (newCoords: Coordinates) => {
    setStart(newCoords);
    setActivePreset(-1);
    try {
      const geo = await reverseGeocode(newCoords);
      if (geo) setStartName(geo.name || geo.displayName.split(',')[0].trim());
    } catch { /* ignore */ }
  };

  const handleEndDragEnd = async (newCoords: Coordinates) => {
    setEnd(newCoords);
    setActivePreset(-1);
    try {
      const geo = await reverseGeocode(newCoords);
      if (geo) setEndName(geo.name || geo.displayName.split(',')[0].trim());
    } catch { /* ignore */ }
  };

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

    const initialName = `Point (${rounded.lat}, ${rounded.lng})`;
    setLastClickedAddress(initialName);
    setIsGeocodingClick(true);

    const targetToUpdate = clickTarget;

    // 1. Immediately update coordinates for instant UI responsiveness
    if (mode === 'map-only') {
      setCenterCoords(rounded);
    } else if (mode === 'start-only') {
      setStart(rounded);
      setStartName(initialName);
      setActivePreset(-1);
    } else if (mode === 'end-only') {
      setEnd(rounded);
      setEndName(initialName);
      setActivePreset(-1);
    } else if (mode === 'both') {
      if (targetToUpdate === 'start') {
        setStart(rounded);
        setStartName(initialName);
        setClickTarget('end');
      } else {
        setEnd(rounded);
        setEndName(initialName);
        setClickTarget('start');
      }
      setActivePreset(-1);
    }

    try {
      const geoResult = await reverseGeocode(rounded);
      if (geoResult) {
        const resolvedName = geoResult.name || geoResult.displayName.split(',')[0].trim();
        setLastClickedAddress(geoResult.displayName);
        if (mode === 'map-only') {
          // logic
        } else if (mode === 'start-only') {
          setStartName(resolvedName);
        } else if (mode === 'end-only') {
          setEndName(resolvedName);
        } else if (mode === 'both') {
          if (targetToUpdate === 'start') {
            setStartName(resolvedName);
          } else {
            setEndName(resolvedName);
          }
        }
      }
    } catch {
      // keep coordinate label
    } finally {
      setIsGeocodingClick(false);
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
      const norm = normalizeTravelProfile(newProfile);
      const durationSeconds = calculateRealisticDuration(
        routeInfo.distanceKm,
        routeInfo.distanceMeters,
        norm
      );
      setRouteInfo({
        ...routeInfo,
        profile: newProfile,
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60),
        durationFormatted: formatDuration(durationSeconds)
      });
    }
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
      return `import { Map } from 'react-map-sdk';\n\nexport function OriginMap() {\n  return (\n    <Map\n      start={{ lat: ${start.lat}, lng: ${start.lng} }}\n      startName="${startName}"\n      draggableMarkers={true}\n      height="520px"\n    />\n  );\n}`;
    }
    if (mode === 'end-only') {
      return `import { Map } from 'react-map-sdk';\n\nexport function DestinationMap() {\n  return (\n    <Map\n      end={{ lat: ${end.lat}, lng: ${end.lng} }}\n      endName="${endName}"\n      draggableMarkers={true}\n      height="520px"\n    />\n  );\n}`;
    }
    return `import { Map, type RouteInfo } from 'react-map-sdk';\n\nexport function RouteOverview() {\n  return (\n    <Map\n      start={{ lat: ${start.lat}, lng: ${start.lng} }}\n      startName="${startName}"\n      end={{ lat: ${end.lat}, lng: ${end.lng} }}\n      endName="${endName}"\n      routing={${routing}}\n      routingProfile="${profile}"\n      routeColor="${routeColor}"\n      draggableMarkers={true}\n      onRouteCalculated={(info: RouteInfo) => {\n        console.log('Distance:', info.distanceKm, 'km');\n        console.log('ETA:', info.durationFormatted);\n      }}\n      height="520px"\n    />\n  );\n}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="minimal-app">
      <header className="top-header">
        <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapIcon size={20} color="#2563eb" />
          <span>React Map SDK</span>
        </div>
      </header>

      <div className="segmented-nav">
        <button className={`seg-btn ${mode === 'map-only' ? 'active' : ''}`} onClick={() => setMode('map-only')}>Map & Search</button>
        <button className={`seg-btn ${mode === 'start-only' ? 'active' : ''}`} onClick={() => setMode('start-only')}>Origin (A)</button>
        <button className={`seg-btn ${mode === 'end-only' ? 'active' : ''}`} onClick={() => setMode('end-only')}>Destination (B)</button>
        <button className={`seg-btn ${mode === 'both' ? 'active' : ''}`} onClick={() => setMode('both')}>Route, ETA & Geocoding</button>
      </div>

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

      <div className="map-frame-card">
        <div className="map-floating-overlay">
          <span className="status-dot"></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            {mode === 'map-only' && `Zoom ${zoom} • Click to inspect location`}
            {mode === 'start-only' && `${startName}`}
            {mode === 'end-only' && `${endName}`}
            {mode === 'both' && (routeInfo ? (
                  <>
                    <span>{startName} → {endName} •</span>
                    <span>{routeInfo.durationFormatted} ({routeInfo.distanceKm} km)</span>
                  </>
                ) : `Next click sets ${clickTarget === 'start' ? 'Origin' : 'Destination'}`)}
          </span>
        </div>

        {mode === 'map-only' && (
          <Map
            center={centerCoords}
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onClick={handleMapClick}
            height="520px"
          />
        )}
        {mode === 'start-only' && (
          <Map
            start={start}
            startName={startName}
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onClick={handleMapClick}
            draggableMarkers={true}
            onStartDragEnd={handleStartDragEnd}
            height="520px"
          />
        )}
        {mode === 'end-only' && (
          <Map
            end={end}
            endName={endName}
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onClick={handleMapClick}
            draggableMarkers={true}
            onEndDragEnd={handleEndDragEnd}
            height="520px"
          />
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
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onClick={handleMapClick}
            draggableMarkers={true}
            onStartDragEnd={handleStartDragEnd}
            onEndDragEnd={handleEndDragEnd}
            height="520px"
          />
        )}
      </div>

      {lastClickedAddress && (
        <div className="reverse-geocode-banner">
          <MapPin size={18} color="#0284c7" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>
              {isGeocodingClick ? 'Reverse Geocoding...' : 'Selected Location Address'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#0c4a6e', fontWeight: 500 }}>
              {lastClickedAddress}
            </div>
          </div>
          <button onClick={() => setLastClickedAddress(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      <div className="control-grid">
        {mode === 'map-only' ? (
          <div className="sub-card">
            <div className="card-title-row">
              <span className="card-title-text">Search Address or Landmark</span>
            </div>
            <div className="field-group" style={{ marginBottom: '1rem' }}>
              <label>Address Autocomplete (Zero-key Geocoding)</label>
              <AddressSearch
                placeholder="Search any landmark, city, or address..."
                onSelect={handleCenterSelect}
              />
            </div>
            <div className="field-group" style={{ marginTop: '0.75rem' }}>
              <label>Zoom Level ({zoom})</label>
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
            <div className="sub-card">
              {(mode === 'start-only' || mode === 'both') && (
                <div style={{ marginBottom: mode === 'both' ? '1.25rem' : '0' }}>
                  <div className="card-title-row">
                    <span className="card-title-text" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={16} color="#059669" /> Origin (A)
                    </span>
                    {mode === 'both' && (
                      <button className="target-badge-btn target-badge-emerald" onClick={() => setClickTarget('start')}>
                        {clickTarget === 'start' && <Crosshair size={13} />} Set Target
                      </button>
                    )}
                  </div>
                  <AddressSearch placeholder="Search origin..." onSelect={handleStartSelect} initialValue={startName} />
                </div>
              )}
              {(mode === 'end-only' || mode === 'both') && (
                <div>
                  <div className="card-title-row">
                    <span className="card-title-text" style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Flag size={16} color="#e11d48" /> Destination (B)
                    </span>
                    {mode === 'both' && (
                      <button className="target-badge-btn target-badge-rose" onClick={() => setClickTarget('end')}>
                        {clickTarget === 'end' && <Crosshair size={13} />} Set Target
                      </button>
                    )}
                  </div>
                  <AddressSearch placeholder="Search destination..." onSelect={handleEndSelect} initialValue={endName} />
                </div>
              )}
            </div>
            {mode === 'both' && (
              <div className="sub-card">
                <div className="card-title-row"><span className="card-title-text">Route & ETA</span></div>
                <div className="profile-btn-group">
                  <button
                    className={`profile-btn ${profile === 'car' || profile === 'driving' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('car')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Car size={15} /> Car
                  </button>
                  <button
                    className={`profile-btn ${profile === 'bike' || profile === 'cycling' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('bike')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Bike size={15} /> Bike
                  </button>
                  <button
                    className={`profile-btn ${profile === 'walking' ? 'active' : ''}`}
                    onClick={() => handleProfileChange('walking')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Footprints size={15} /> Walking
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
                    <Plane size={16} color="#b45309" />
                    <div>
                      <b>Direct Great-Circle Path:</b> No continuous overland road route exists between these locations.
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
                      <span className="route-insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={14} color="#059669" /> From
                      </span>
                      <span className="route-insight-val" title={startName}>
                        {startName.split(',')[0]}
                      </span>
                    </div>

                    <div className="route-insight-row">
                      <span className="route-insight-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Flag size={14} color="#e11d48" /> To
                      </span>
                      <span className="route-insight-val" title={endName}>
                        {endName.split(',')[0]}
                      </span>
                    </div>

                    <button className="btn-swap" onClick={handleSwapPoints}>
                      <ArrowLeftRight size={14} /> Swap Origin & Destination
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
          <span className="code-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Code size={15} color="#64748b" />
            React Component Code
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-copy" onClick={() => setShowCode(!showCode)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Code size={13} />
              {showCode ? 'Hide Code' : 'View Code'}
            </button>
            <button className="btn-copy" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy JSX'}
            </button>
          </div>
        </div>
        {showCode && <pre className="code-body">{getCodeSnippet()}</pre>}
      </div>
    </div>
  );
};
