"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default marker icons
if (typeof window !== "undefined") {
  const L = require("leaflet")
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

// Map Click Handler Component
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: any) => {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface LocationMapPickerProps {
  lat: string
  lng: string
  onLocationChange: (lat: string, lng: string) => void
}

export default function LocationMapPicker({ lat, lng, onLocationChange }: LocationMapPickerProps) {
  const center: [number, number] = [
    lat ? parseFloat(lat) : 13.7563,
    lng ? parseFloat(lng) : 100.5018
  ]

  return (
    <div className="h-[400px] rounded-lg overflow-hidden border border-border relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        key={`${lat}-${lng}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler
          onClick={(clickLat, clickLng) => {
            onLocationChange(clickLat.toFixed(6), clickLng.toFixed(6))
          }}
        />
        {lat && lng && (
          <Marker
            position={[parseFloat(lat), parseFloat(lng)]}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                const marker = e.target
                const position = marker.getLatLng()
                onLocationChange(
                  position.lat.toFixed(6),
                  position.lng.toFixed(6)
                )
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
