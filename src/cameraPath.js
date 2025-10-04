/**
 * Calculate great circle distance between two points
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function greatCircleDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Interpolate between two points on a great circle
 * @param {number} lat1 - Start latitude
 * @param {number} lon1 - Start longitude
 * @param {number} lat2 - End latitude
 * @param {number} lon2 - End longitude
 * @param {number} fraction - Fraction along the path (0 to 1)
 * @returns {{lat: number, lon: number}}
 */
function interpolateGreatCircle(lat1, lon1, lat2, lon2, fraction) {
  const φ1 = lat1 * Math.PI / 180;
  const λ1 = lon1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const λ2 = lon2 * Math.PI / 180;

  const d = greatCircleDistance(lat1, lon1, lat2, lon2) / 6371; // angular distance
  const a = Math.sin((1 - fraction) * d) / Math.sin(d);
  const b = Math.sin(fraction * d) / Math.sin(d);

  const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
  const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
  const z = a * Math.sin(φ1) + b * Math.sin(φ2);

  const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
  const λ = Math.atan2(y, x);

  return {
    lat: φ * 180 / Math.PI,
    lon: λ * 180 / Math.PI
  };
}

/**
 * Generate camera path for animation
 * @param {Array<{lat: number, lon: number, name: string}>} places - Array of geocoded places
 * @param {number} totalFrames - Total number of frames to generate
 * @returns {Array<{lat: number, lon: number, altitude: number, frame: number}>}
 */
export function generateCameraPath(places, totalFrames) {
  if (places.length < 2) {
    throw new Error('Need at least 2 places to generate a camera path');
  }

  const cameraPath = [];
  const segments = places.length - 1;
  const framesPerSegment = Math.floor(totalFrames / segments);

  for (let i = 0; i < segments; i++) {
    const start = places[i];
    const end = places[i + 1];
    const distance = greatCircleDistance(start.lat, start.lon, end.lat, end.lon);
    
    // Calculate altitude based on distance (higher for longer distances)
    const baseAltitude = Math.max(100000, distance * 1000); // meters
    
    const segmentFrames = (i === segments - 1) ? 
      (totalFrames - i * framesPerSegment) : 
      framesPerSegment;

    for (let j = 0; j < segmentFrames; j++) {
      const t = j / segmentFrames;
      
      // Smooth easing function (ease-in-out)
      const smoothT = t < 0.5 ? 
        2 * t * t : 
        1 - Math.pow(-2 * t + 2, 2) / 2;

      const pos = interpolateGreatCircle(start.lat, start.lon, end.lat, end.lon, smoothT);
      
      // Vary altitude along the path (arc)
      const altitudeMultiplier = Math.sin(smoothT * Math.PI) * 0.5 + 0.5;
      const altitude = baseAltitude * (0.5 + altitudeMultiplier);

      cameraPath.push({
        lat: pos.lat,
        lon: pos.lon,
        altitude: altitude,
        frame: i * framesPerSegment + j
      });
    }
  }

  return cameraPath;
}
