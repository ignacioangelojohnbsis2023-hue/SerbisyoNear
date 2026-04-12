export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.display_name || "";
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return "";
  }
}

// Geoapify - optional, requires API key
export async function geoapifyGeocode(address, apiKey) {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;
    return {
      lat: data.features[0].properties.lat,
      lon: data.features[0].properties.lon,
      formatted: data.features[0].properties.formatted
    };
  } catch (error) {
    console.error("Geoapify error:", error);
    return null;
  }
}