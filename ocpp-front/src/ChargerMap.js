import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon
const chargerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/808/808439.png", // EV charger icon
  iconSize: [40, 40], // size of the icon
  iconAnchor: [20, 40], // point of the icon which corresponds to marker location
  popupAnchor: [0, -40], // where the popup opens relative to the iconAnchor
});

const ChargerMap = () => {
  const position = [36.8065, 10.1815]; // Tunis, Tunisia

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      {/* Base Map */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker with custom icon */}
      <Marker position={position} icon={chargerIcon}>
        <Popup>
          <div style={{ textAlign: "center" }}>
            <h3>⚡ EV Charger</h3>
            <p>Location: Tunis, Tunisia</p>
            <button style={{ padding: "5px 10px", borderRadius: "5px" }}>
              Start Charging
            </button>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default ChargerMap;
