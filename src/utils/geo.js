/**
 * 🛰️ HARDENED OFFLINE LOCATION FALLBACK
 * Objective: Never break UI, Always return data
 */
export async function getLocationSafe() {
  if (!navigator.geolocation) {
    return { lat: 0, lng: 0, fallback: true };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        fallback: false
      }),
      () => resolve({ lat: 0, lng: 0, fallback: true }),
      { 
        timeout: 4000, 
        enableHighAccuracy: false,
        maximumAge: 10000 
      }
    );
  });
}

export function formatCoords(lat, lng) {
  if (lat === 0 && lng === 0) return "GRID-LOCK (OFFLINE)";
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

export const getCurrentPosition = getLocationSafe;

export function getGoogleMapsUrl(lat, lng) {
  // Handle case where first arg is a {lat, lng} object
  if (lat && typeof lat === 'object' && !lng) {
    lng = lat.lng;
    lat = lat.lat;
  }
  if (!lat || !lng) return "#";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
