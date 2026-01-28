"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet"
import type { Map as LeafletMap } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Wifi, WifiOff, Battery, Thermometer, Droplets, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Fix Leaflet default icon issue in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

// Custom icon for online devices
const onlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Custom icon for offline devices
const offlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Device {
  id: string
  name: string
  type: string
  location: string
  is_online: boolean
  latitude?: number
  longitude?: number
  battery_level?: number
  last_seen?: string
}

interface SensorData {
  device_id: string
  temperature?: number
  humidity?: number
  timestamp: string
}

interface InteractiveMapProps {
  devices: Device[]
  sensorData?: SensorData[]
  center: { lat: number; lng: number }
  zoom: number
  onDeviceClick?: (device: Device) => void
  onLocationUpdate?: (deviceId: string, lat: number, lng: number) => Promise<void>
  editMode?: boolean
  selectedDeviceForEdit?: string | null
  centerPickMode?: boolean
  onCenterPicked?: (lat: number, lng: number) => void
}

// Component to handle map center changes
function MapUpdater({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom)
  }, [center, zoom, map])
  
  return null
}

// Component to handle click-to-place marker
function MapClickHandler({ 
  editMode, 
  selectedDeviceForEdit,
  onMapClick,
  centerPickMode,
  onCenterPick,
}: { 
  editMode: boolean
  selectedDeviceForEdit: string | null
  onMapClick: (lat: number, lng: number) => void
  centerPickMode?: boolean
  onCenterPick?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (centerPickMode && onCenterPick) {
        onCenterPick(e.latlng.lat, e.latlng.lng)
      } else if (editMode && selectedDeviceForEdit) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  
  return null
}

export function InteractiveMap({ 
  devices, 
  sensorData = [], 
  center, 
  zoom,
  onDeviceClick,
  onLocationUpdate,
  editMode = false,
  selectedDeviceForEdit = null,
  centerPickMode = false,
  onCenterPicked,
}: InteractiveMapProps) {
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [updating, setUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const tileLayerRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Check initial theme
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkTheme(isDark)

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkTheme(isDark)
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Apply theme filter to tile layer
  useEffect(() => {
    if (!mounted) return

    const applyFilterToTiles = () => {
      const tileElements = document.querySelectorAll('.leaflet-tile-pane img')
      const filter = isDarkTheme 
        ? 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)'
        : 'brightness(1) contrast(1) saturate(1)'

      tileElements.forEach((element) => {
        (element as HTMLElement).style.filter = filter
      })
    }

    // Apply filter immediately
    applyFilterToTiles()

    // Watch for new tiles being added to DOM
    const tilePane = document.querySelector('.leaflet-tile-pane')
    if (tilePane) {
      const observer = new MutationObserver(() => {
        applyFilterToTiles()
      })
      observer.observe(tilePane, { childList: true, subtree: true })
      return () => observer.disconnect()
    }
  }, [isDarkTheme, mounted])

  // Filter devices with valid coordinates
  const validDevices = useMemo(
    () => devices.filter((d) => d.latitude && d.longitude),
    [devices]
  )

  // Get sensor data for a device
  const getSensorData = (deviceId: string) => {
    if (!Array.isArray(sensorData)) return undefined
    return sensorData.find((data) => data.device_id === deviceId)
  }

  // Handle map click in edit mode
  const handleMapClick = (lat: number, lng: number) => {
    setTempMarker({ lat, lng })
  }

  // Handle center pick
  const handleCenterPick = (lat: number, lng: number) => {
    if (onCenterPicked) {
      onCenterPicked(lat, lng)
    }
  }

  // Confirm location update
  const handleConfirmLocation = async () => {
    if (!tempMarker || !selectedDeviceForEdit || !onLocationUpdate) return
    
    setUpdating(true)
    try {
      await onLocationUpdate(selectedDeviceForEdit, tempMarker.lat, tempMarker.lng)
      setTempMarker(null)
    } catch (error) {
      console.error('Failed to update location:', error)
    } finally {
      setUpdating(false)
    }
  }

  // Handle marker drag end
  const handleMarkerDragEnd = async (deviceId: string, newPos: L.LatLng) => {
    if (!onLocationUpdate) return
    
    setUpdating(true)
    try {
      await onLocationUpdate(deviceId, newPos.lat, newPos.lng)
    } catch (error) {
      console.error('Failed to update location:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (!mounted) {
    return (
      <div className="h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      scrollWheelZoom={true}
      className={isDarkTheme ? "dark" : ""}
      key={`map-${center.lat}-${center.lng}-${zoom}`}
    >
      <MapUpdater center={center} zoom={zoom} />
      <MapClickHandler 
        editMode={editMode} 
        selectedDeviceForEdit={selectedDeviceForEdit}
        onMapClick={handleMapClick}
        centerPickMode={centerPickMode}
        onCenterPick={handleCenterPick}
      />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ref={tileLayerRef}
      />

      {/* Temporary marker for new location */}
      {tempMarker && (
        <Marker
          position={[tempMarker.lat, tempMarker.lng]}
          icon={new L.Icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })}
        >
          <Popup>
            <div className="space-y-2 min-w-[200px]">
              <p className="font-semibold">ตำแหน่งใหม่</p>
              <p className="text-xs text-muted-foreground">
                {tempMarker.lat.toFixed(6)}, {tempMarker.lng.toFixed(6)}
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleConfirmLocation}
                  disabled={updating}
                  className="flex-1"
                >
                  {updating ? "กำลังบันทึก..." : "ยืนยัน"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setTempMarker(null)}
                  disabled={updating}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Device markers */}
      {validDevices.map((device) => {
        const sensor = getSensorData(device.id)
        const isDraggable = editMode && device.id === selectedDeviceForEdit
        
        return (
          <Marker
            key={device.id}
            position={[device.latitude!, device.longitude!]}
            icon={device.is_online ? onlineIcon : offlineIcon}
            draggable={isDraggable}
            eventHandlers={{
              click: () => {
                if (onDeviceClick && !editMode) {
                  onDeviceClick(device)
                }
              },
              dragend: (e) => {
                if (isDraggable) {
                  const marker = e.target
                  const position = marker.getLatLng()
                  handleMarkerDragEnd(device.id, position)
                }
              },
            }}
          >
          <Popup>
              <div 
                className="min-w-[250px] space-y-2"
                style={{
                  backgroundColor: isDarkTheme ? '#1a1a1a' : '#ffffff',
                  color: isDarkTheme ? '#e5e5e5' : '#000000',
                  borderRadius: '0.5rem',
                  border: `1px solid ${isDarkTheme ? '#404040' : '#e5e5e5'}`,
                  padding: '0.75rem',
                }}
              >
                {/* Device Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                      {device.name}
                    </h3>
                    <p className="text-xs" style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>
                      {device.location}
                    </p>
                  </div>
                  <Badge 
                    variant={device.is_online ? "default" : "destructive"} 
                    className="shrink-0"
                    style={{
                      backgroundColor: device.is_online 
                        ? (isDarkTheme ? '#22c55e' : '#22c55e')
                        : (isDarkTheme ? '#ef4444' : '#ef4444'),
                      color: '#ffffff',
                    }}
                  >
                    {device.is_online ? "ออนไลน์" : "ออฟไลน์"}
                  </Badge>
                </div>

                {/* Device Info */}
                <div 
                  className="space-y-1 text-sm border-t pt-2"
                  style={{ borderTopColor: isDarkTheme ? '#404040' : '#e5e5e5' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>ประเภท:</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{
                        backgroundColor: isDarkTheme ? '#2a2a2a' : '#f5f5f5',
                        color: isDarkTheme ? '#e5e5e5' : '#000000',
                        borderColor: isDarkTheme ? '#404040' : '#d5d5d5',
                      }}
                    >
                      {device.type}
                    </Badge>
                  </div>
                  
                  {device.latitude && device.longitude && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>
                        <MapPin className="w-3 h-3" />
                        พิกัด:
                      </span>
                      <span 
                        className="font-mono"
                        style={{ color: isDarkTheme ? '#e5e5e5' : '#000000' }}
                      >
                        {device.latitude.toFixed(6)}, {device.longitude.toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sensor Data */}
                {sensor && (
                  <div 
                    className="space-y-1 border-t pt-2"
                    style={{ borderTopColor: isDarkTheme ? '#404040' : '#e5e5e5' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                      ข้อมูลเซ็นเซอร์
                    </p>
                    {sensor.temperature !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1" style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>
                          <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                          อุณหภูมิ:
                        </span>
                        <span className="font-semibold" style={{ color: isDarkTheme ? '#e5e5e5' : '#000000' }}>
                          {sensor.temperature}°C
                        </span>
                      </div>
                    )}
                    {sensor.humidity !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1" style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />
                          ความชื้น:
                        </span>
                        <span className="font-semibold" style={{ color: isDarkTheme ? '#e5e5e5' : '#000000' }}>
                          {sensor.humidity}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Battery Level */}
                {device.battery_level !== undefined && (
                  <div 
                    className="border-t pt-2"
                    style={{ borderTopColor: isDarkTheme ? '#404040' : '#e5e5e5' }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1" style={{ color: isDarkTheme ? '#a0a0a0' : '#666666' }}>
                        <Battery className="w-3.5 h-3.5" />
                        แบตเตอรี่:
                      </span>
                      <span 
                        className="font-semibold"
                        style={{
                          color: device.battery_level < 20 ? "#ef4444" : 
                          device.battery_level < 50 ? "#f97316" : 
                          "#22c55e"
                        }}
                      >
                        {device.battery_level}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Icon */}
                <div 
                  className="flex items-center justify-center gap-2 text-xs border-t pt-2"
                  style={{ borderTopColor: isDarkTheme ? '#404040' : '#e5e5e5' }}
                >
                  {device.is_online ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>เชื่อมต่อแล้ว</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-destructive" />
                      <span style={{ color: '#ef4444', fontWeight: 500 }}>ไม่ได้เชื่อมต่อ</span>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
