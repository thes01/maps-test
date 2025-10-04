import axios from 'axios';

/**
 * Geocode a place name or return coordinates if already in lat,lon format
 * @param {string} place - Place name or "lat,lon" string
 * @returns {Promise<{lat: number, lon: number, name: string}>}
 */
export async function geocodePlace(place) {
  // Check if already in lat,lon format
  const coordMatch = place.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lon: parseFloat(coordMatch[2]),
      name: `${coordMatch[1]},${coordMatch[2]}`
    };
  }

  // Use Nominatim API for geocoding
  const url = 'https://nominatim.openstreetmap.org/search';
  const params = {
    q: place,
    format: 'json',
    limit: 1
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'CLI-3D-Journey-Generator/1.0'
      },
      timeout: 10000
    });

    if (response.data.length === 0) {
      throw new Error(`Could not geocode place: ${place}`);
    }

    const result = response.data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name
    };
  } catch (error) {
    // Fallback to basic city coordinates if API fails
    const fallbackCities = {
      'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris, France' },
      'london': { lat: 51.5074, lon: -0.1278, name: 'London, United Kingdom' },
      'new york': { lat: 40.7128, lon: -74.0060, name: 'New York, USA' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo, Japan' },
      'sydney': { lat: -33.8688, lon: 151.2093, name: 'Sydney, Australia' },
      'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin, Germany' },
      'rome': { lat: 41.9028, lon: 12.4964, name: 'Rome, Italy' },
      'dubai': { lat: 25.2048, lon: 55.2708, name: 'Dubai, UAE' },
      'singapore': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
      'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, USA' }
    };
    
    const lowerPlace = place.toLowerCase();
    if (fallbackCities[lowerPlace]) {
      console.warn(`  Note: Using fallback coordinates for "${place}" (API unavailable)`);
      return fallbackCities[lowerPlace];
    }
    
    throw new Error(`Geocoding failed for "${place}": ${error.message}. Try using lat,lon coordinates instead.`);
  }
}

/**
 * Geocode multiple places
 * @param {string[]} places - Array of place names or coordinates
 * @returns {Promise<Array<{lat: number, lon: number, name: string}>>}
 */
export async function geocodePlaces(places) {
  const results = [];
  
  for (const place of places) {
    console.log(`Geocoding: ${place}`);
    const result = await geocodePlace(place);
    results.push(result);
    // Rate limiting: wait 1 second between requests to respect Nominatim usage policy
    if (places.indexOf(place) < places.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
