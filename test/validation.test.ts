import {
  isValidLatitude,
  isValidLongitude,
  validateCoordinates,
  calculateInitialCenter,
  calculateInitialZoom
} from '../src/index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Running SDK unit tests...');

// 1. Latitude validation
assert(isValidLatitude(0) === true, 'Latitude 0 is valid');
assert(isValidLatitude(90) === true, 'Latitude 90 is valid');
assert(isValidLatitude(-90) === true, 'Latitude -90 is valid');
assert(isValidLatitude(12.9716) === true, 'Latitude 12.9716 is valid');
assert(isValidLatitude(90.1) === false, 'Latitude 90.1 is invalid');
assert(isValidLatitude(-90.1) === false, 'Latitude -90.1 is invalid');
assert(isValidLatitude(120) === false, 'Latitude 120 is invalid');
assert(isValidLatitude(NaN) === false, 'Latitude NaN is invalid');

// 2. Longitude validation
assert(isValidLongitude(0) === true, 'Longitude 0 is valid');
assert(isValidLongitude(180) === true, 'Longitude 180 is valid');
assert(isValidLongitude(-180) === true, 'Longitude -180 is valid');
assert(isValidLongitude(79.1597) === true, 'Longitude 79.1597 is valid');
assert(isValidLongitude(180.1) === false, 'Longitude 180.1 is invalid');
assert(isValidLongitude(-180.1) === false, 'Longitude -180.1 is invalid');
assert(isValidLongitude(200) === false, 'Longitude 200 is invalid');
assert(isValidLongitude(NaN) === false, 'Longitude NaN is invalid');

// 3. validateCoordinates object validation
const validCoords = validateCoordinates({ lat: 12.9716, lng: 79.1597 });
assert(validCoords.isValid === true, 'Valid coordinates object returns true');

const invalidLat = validateCoordinates({ lat: 120, lng: 79.1597 });
assert(invalidLat.isValid === false, 'Invalid lat returns false');
assert(typeof invalidLat.error === 'string', 'Invalid lat returns error message');

const invalidLng = validateCoordinates({ lat: 12.9716, lng: 200 });
assert(invalidLng.isValid === false, 'Invalid lng returns false');

// 4. Center derivation logic
const centerWithBoth = calculateInitialCenter({
  start: { lat: 10, lng: 20 },
  end: { lat: 30, lng: 40 }
});
assert(centerWithBoth.lat === 20 && centerWithBoth.lng === 30, 'Midpoint center is correct for both start and end');

const centerWithStartOnly = calculateInitialCenter({
  start: { lat: 12.9716, lng: 79.1597 }
});
assert(centerWithStartOnly.lat === 12.9716 && centerWithStartOnly.lng === 79.1597, 'Center defaults to start point when start only');

const centerWithExplicit = calculateInitialCenter({
  center: { lat: 50, lng: 50 },
  start: { lat: 10, lng: 20 },
  end: { lat: 30, lng: 40 }
});
assert(centerWithExplicit.lat === 50 && centerWithExplicit.lng === 50, 'Explicit center takes precedence');

// 5. Zoom calculation
const zoomBoth = calculateInitialZoom({
  start: { lat: 10, lng: 20 },
  end: { lat: 30, lng: 40 }
});
assert(zoomBoth === 10, 'Sensible zoom level 10 for route start+end');

const zoomExplicit = calculateInitialZoom({
  zoom: 15,
  start: { lat: 10, lng: 20 }
});
assert(zoomExplicit === 15, 'Explicit zoom is respected');

console.log('✅ All 20 unit assertions passed successfully!');
