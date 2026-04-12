import React, { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import { geocodeAddress } from "../lib/geocode";
import { calculateDistance } from "../lib/distance";

export default function AddressSearch({ providers }) {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState({ lat: 14.5995, lon: 120.9842 }); // default Manila
  const [sortedProviders, setSortedProviders] = useState([]);

  useEffect(() => {
  if (!coords || !providers) return;

  const updated = providers.map((pro) => {
    const proLat = pro.latitude ?? pro.lat;
    const proLon = pro.longitude ?? pro.lon;

    if (!proLat || !proLon) return pro;

    const distance = calculateDistance(
      coords.lat,
      coords.lon,
      proLat,
      proLon
    );

    return { ...pro, distance };
  });

  // Sort nearest first
  updated.sort((a, b) => a.distance - b.distance);

  setSortedProviders(updated);
}, [coords, providers]);

  // Handle searching an address
  const handleSearch = async () => {
    if (!address) return alert("Please enter an address");
    const result = await geocodeAddress(address); // your geocode function
    if (result) {
      setCoords({ lat: result.lat, lon: result.lon });
    } else {
      alert("Address not found");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          className="w-full sm:w-auto rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Search
        </button>
      </div>

      {/* MapComponent receives coords and providers */}
      <MapComponent lat={coords.lat} lon={coords.lon} providers={sortedProviders} />
    </div>
  );
}