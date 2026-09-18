// MapComponent.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapComponent({ lat, lon, markers = [], onMapClick }) {
  function MapViewport() {
    const map = useMap();
    React.useEffect(() => {
      map.setView([lat, lon], markers.length ? 14 : 13);
    }, [map, lat, lon, markers.length]);
    return null;
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={markers.length ? 14 : 13}
      style={{ height: "300px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapViewport />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lon]} />
      ))}
      <ClickHandler />
    </MapContainer>
  );
}