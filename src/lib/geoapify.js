const API_KEY = "YOUR_GEOAPIFY_KEY";

export async function geocodeGeoapify(address) {
  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address
      )}&apiKey=${API_KEY}&limit=1`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      return {
        lat: coords[1],
        lon: coords[0],
      };
    }
    return null;
  } catch (err) {
    console.error("Geoapify geocode error:", err);
    return null;
  }
}