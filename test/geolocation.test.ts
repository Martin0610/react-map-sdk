import {
  createUserLocationPinSvg,
  getCurrentLocation,
  watchLiveLocation
} from '../src/index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running Geolocation unit tests...');

// 1. User pin SVG generator
const svg = createUserLocationPinSvg();
assert(svg.includes('react-map-pulse'), 'User pin contains pulsing CSS animation keyframe');
assert(svg.includes('#2563eb'), 'User pin uses Google Maps style blue accent');

// 2. Node environment fallback (mock geolocation)
let mockSuccess = true;
const mockPosition = {
  coords: {
    latitude: 12.9715987,
    longitude: 79.1596789,
    accuracy: 25.4
  }
};

const mockGeolocation = {
  getCurrentPosition: (success: (pos: any) => void, error: (err: any) => void) => {
    if (mockSuccess) {
      success(mockPosition);
    } else {
      error(new Error('Permission denied'));
    }
  },
  watchPosition: (success: (pos: any) => void) => {
    success(mockPosition);
    return 123;
  },
  clearWatch: (id: number) => {
    assert(id === 123, 'clearWatch passed correct watch ID');
  }
};

if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = { geolocation: mockGeolocation };
} else {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: mockGeolocation,
    configurable: true,
    writable: true
  });
}

async function runTests() {
  const coords = await getCurrentLocation();
  assert(coords.lat === 12.971599, 'Latitude rounded to 6 decimal places');
  assert(coords.lng === 79.159679, 'Longitude rounded to 6 decimal places');
  assert(coords.accuracy === 25, 'Accuracy rounded correctly');
  assert(coords.source === 'gps', 'Source identified as gps');

  let watchFired = false;
  const unsubscribe = watchLiveLocation((c) => {
    assert(c.lat === 12.971599, 'Watch latitude correct');
    assert(c.lng === 79.159679, 'Watch longitude correct');
    assert(c.accuracy === 25, 'Watch accuracy correct');
    assert(c.source === 'gps', 'Watch source is gps');
    watchFired = true;
  });
  assert(watchFired === true, 'watchLiveLocation fired on location update');
  unsubscribe();

  console.log('✅ All Geolocation unit assertions passed successfully!');
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
