import { geocodeAddress, reverseGeocode } from '../src/index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runGeocodingTests() {
  console.log('Running Geocoding unit tests...');

  // 1. Empty query returns empty array immediately
  const emptyRes = await geocodeAddress('');
  assert(Array.isArray(emptyRes) && emptyRes.length === 0, 'Empty string returns empty array');

  const whitespaceRes = await geocodeAddress('   ');
  assert(Array.isArray(whitespaceRes) && whitespaceRes.length === 0, 'Whitespace string returns empty array');

  // 2. Invalid coordinates return null for reverse geocode immediately
  const invalidLatRes = await reverseGeocode({ lat: 95, lng: 80 });
  assert(invalidLatRes === null, 'Invalid latitude returns null');

  const invalidLngRes = await reverseGeocode({ lat: 10, lng: 200 });
  assert(invalidLngRes === null, 'Invalid longitude returns null');

  // 3. Test mock response for geocodeAddress
  const originalFetch = globalThis.fetch;

  try {
    // Mock successful Nominatim response
    globalThis.fetch = async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/search')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              place_id: 12345,
              lat: '13.0827',
              lon: '80.2707',
              display_name: 'Chennai, Tamil Nadu, India',
              name: 'Chennai',
              type: 'city',
              importance: 0.85,
              boundingbox: ['12.9', '13.2', '80.1', '80.3'],
              address: {
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India'
              }
            }
          ]
        } as Response;
      }

      if (urlStr.includes('/reverse')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            place_id: 67890,
            lat: '12.9716',
            lon: '79.1597',
            display_name: 'Vellore Fort, Vellore, Tamil Nadu, India',
            name: 'Vellore Fort',
            type: 'fort',
            importance: 0.75,
            address: {
              tourism: 'Vellore Fort',
              city: 'Vellore',
              state: 'Tamil Nadu',
              country: 'India'
            }
          })
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({})
      } as Response;
    };

    // Forward geocoding test
    const geoResults = await geocodeAddress('Chennai', { limit: 1 });
    assert(geoResults.length === 1, 'Geocode returns 1 result');
    assert(geoResults[0].coordinates.lat === 13.0827, 'Geocode correctly parsed latitude');
    assert(geoResults[0].coordinates.lng === 80.2707, 'Geocode correctly parsed longitude');
    assert(geoResults[0].displayName === 'Chennai, Tamil Nadu, India', 'Geocode displayName matches');
    assert(geoResults[0].addressDetails?.city === 'Chennai', 'Geocode addressDetails matches');

    // Reverse geocoding test
    const revResult = await reverseGeocode({ lat: 12.9716, lng: 79.1597 });
    assert(revResult !== null, 'Reverse geocode returns result object');
    assert(revResult?.coordinates.lat === 12.9716, 'Reverse geocode lat matches');
    assert(revResult?.coordinates.lng === 79.1597, 'Reverse geocode lng matches');
    assert(revResult?.name === 'Vellore Fort', 'Reverse geocode name matches');
    assert(revResult?.displayName.includes('Vellore Fort'), 'Reverse geocode displayName contains name');

    // Cache hit test (should return from memory without throwing even if fetch throws)
    globalThis.fetch = async () => {
      throw new Error('Network should not be called on cached query');
    };

    const cachedGeo = await geocodeAddress('Chennai', { limit: 1 });
    assert(cachedGeo.length === 1 && cachedGeo[0].coordinates.lat === 13.0827, 'Cached geocode returns correct cached result');

    const cachedRev = await reverseGeocode({ lat: 12.9716, lng: 79.1597 });
    assert(cachedRev?.name === 'Vellore Fort', 'Cached reverse geocode returns correct cached result');

    console.log('✅ All Geocoding assertions passed successfully!');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runGeocodingTests().catch((err) => {
  console.error('❌ Geocoding test failed:', err);
  process.exit(1);
});
