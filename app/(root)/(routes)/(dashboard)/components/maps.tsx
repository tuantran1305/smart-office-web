"use client";

import React, { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

interface MapsProps {
  latitude: number;
  longitude: number;
  safe_zone: any;
}

import { icon } from "leaflet";

// Component to update map center when coordinates change
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const markerIcon = icon({
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
  iconAnchor: [10, 42],
  popupAnchor: [0, -51],
});

const safeIcon = icon({
  iconUrl: "/leaflet/images/safe.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
  iconSize: [18, 28],
  iconAnchor: [6, 22],
  popupAnchor: [0, -51],
});

const Maps: React.FC<MapsProps> = ({ latitude, longitude, safe_zone }) => {
  // Parse and validate coordinates
  const lat = latitude ? parseFloat(String(latitude)) : null;
  const lng = longitude ? parseFloat(String(longitude)) : null;
  
  // Parse safe_zone if it's a string
  let safeZoneArray = [];
  if (typeof safe_zone === "string") {
    try {
      safeZoneArray = JSON.parse(safe_zone);
    } catch (e) {
      console.error("Failed to parse safe_zone", e);
    }
  } else if (Array.isArray(safe_zone)) {
    safeZoneArray = safe_zone;
  }

  // Initial center - use first valid coordinate or default
  const [initialCenter] = useState<[number, number]>(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
    // Default to Vietnam center if no valid coordinates
    return [16.0544, 108.2022];
  });

  // Check if we have valid coordinates
  const hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng);

  if (!hasValidCoords) {
    return (
      <div className="flex items-center justify-center h-[600px] text-center text-muted-foreground">
        Đang chờ dữ liệu vị trí từ thiết bị...
      </div>
    );
  }

  const currentCenter: [number, number] = [lat, lng];

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={16}
      style={{ height: "600px", width: "100%" }}
      scrollWheelZoom={true}
    >
      <MapUpdater center={currentCenter} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={currentCenter} icon={markerIcon}>
        <Popup>Vị trí hiện tại</Popup>
      </Marker>
      {safeZoneArray.length > 0 && safeZoneArray.map((item: any, idx: number) => {
        const safeLat = parseFloat(item.latitude);
        const safeLng = parseFloat(item.longitude);
        const rad = parseFloat(item.radius);
        
        if (isNaN(safeLat) || isNaN(safeLng) || isNaN(rad)) {
          console.warn(`Invalid safe zone data at index ${idx}`, item);
          return null;
        }
        
        return (
          <React.Fragment key={idx}>
            <Marker
              position={[safeLat, safeLng]}
              icon={safeIcon}
            >
              <Popup>Vị trí an toàn {idx + 1}</Popup>
            </Marker>
            <Circle
              center={{ lat: safeLat, lng: safeLng }}
              fillColor="green"
              radius={rad}
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default React.memo(Maps);
