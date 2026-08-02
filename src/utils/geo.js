/**
 * 🛰️ HARDENED OFFLINE LOCATION FALLBACK
 * Objective: Never break UI, Always return data
 */
export async function getLocationSafe() {
  if (!navigator.geolocation) {
    console.warn("Geolocation API not supported.");
    return { lat: 0, lng: 0, fallback: true };
  }

  const getPos = (options) => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

  try {
    // Attempt 1: High Accuracy, No Cache (Force GPS chip)
    const pos = await getPos({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false, accuracy: pos.coords.accuracy };
  } catch (err1) {
    console.warn("High accuracy GPS failed:", err1.message, "Code:", err1.code);
    try {
      // Attempt 2: Low Accuracy, Allow Cache (Network/Cell tower fallback)
      const pos = await getPos({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false, accuracy: pos.coords.accuracy };
    } catch (err2) {
      console.error("All geolocation attempts failed:", err2.message);
      return { lat: 0, lng: 0, fallback: true };
    }
  }
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
