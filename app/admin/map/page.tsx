"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import dynamic from "next/dynamic"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, RefreshCw, Wifi, WifiOff, Battery, Thermometer, Droplets, Edit, Save, X, Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Dynamically import InteractiveMap to avoid SSR issues with Leaflet
const InteractiveMap = dynamic(
  () => import("@/components/admin/interactive-map").then((mod) => mod.InteractiveMap),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    )
  }
)

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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MapPage() {
  const { toast } = useToast()
  const { data: devices, error, mutate } = useSWR<Device[]>("/api/devices", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const { data: sensorData } = useSWR<SensorData[]>("/api/devices/sensor-data", fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  })

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 13.7563, lng: 100.5018 }) // Default: Bangkok
  const [mapCenterInput, setMapCenterInput] = useState(`${13.7563}, ${100.5018}`) // For input field
  const [zoom, setZoom] = useState(12)
  const [editMode, setEditMode] = useState(false)
  const [selectedDeviceForEdit, setSelectedDeviceForEdit] = useState<string | null>(null)
  const [centerPickMode, setCenterPickMode] = useState(false)
  const [showAddLocationNotice, setShowAddLocationNotice] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Get unique device types
  const deviceTypes = Array.from(new Set(devices?.map(d => d.type) || []))

  // Find sensor data for selected device
  const getDeviceSensorData = (deviceId: string) => {
    if (!sensorData) return null
    return sensorData.find((data) => data.device_id === deviceId)
  }

  // Group devices by location
  // Memoize location-separated devices to avoid recalculation
  const { devicesWithLocation, devicesWithoutLocation } = useMemo(() => ({
    devicesWithLocation: devices?.filter((d) => d.latitude && d.longitude) || [],
    devicesWithoutLocation: devices?.filter((d) => !d.latitude || !d.longitude) || [],
  }), [devices])

  // Memoize filtered devices - recalculates only when search, types, or devices change
  const filteredDevices = useMemo(() => {
    return devices?.filter((device) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Type filter
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(device.type)
      
      return matchesSearch && matchesType
    }) || []
  }, [devices, searchQuery, selectedTypes])

  // Memoize filtered devices with/without location
  const filteredDevicesWithLocation = useMemo(() => 
    filteredDevices.filter((d) => d.latitude && d.longitude), 
    [filteredDevices]
  )
  
  const filteredDevicesWithoutLocation = useMemo(() => 
    filteredDevices.filter((d) => !d.latitude || !d.longitude), 
    [filteredDevices]
  )

  // Listen for theme changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkTheme(isDark)

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkTheme(isDark)
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  // Toggle type filter
  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // Select all types
  const selectAllTypes = () => {
    setSelectedTypes(deviceTypes)
  }

  // Clear all types
  const clearAllTypes = () => {
    setSelectedTypes([])
  }

  useEffect(() => {
    // Center map on first device with location
    if (devicesWithLocation.length > 0 && !selectedDevice) {
      const firstDevice = devicesWithLocation[0]
      setMapCenter({ lat: firstDevice.latitude!, lng: firstDevice.longitude! })
    }
  }, [devices])

  const handleRefresh = () => {
    mutate()
  }

  const handleDeviceClick = (device: Device) => {
    if (!editMode) {
      setSelectedDevice(device)
      if (device.latitude && device.longitude) {
        setMapCenter({ lat: device.latitude, lng: device.longitude })
        setZoom(15)
      }
    }
  }

  // Handle location update
  const handleLocationUpdate = async (deviceId: string, lat: number, lng: number) => {
    try {
      console.log('Updating location for device:', deviceId, 'to:', lat, lng)
      
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('Failed to update location:', data)
        throw new Error(data.error || 'Failed to update location')
      }

      console.log('Location updated successfully:', data)

      // Refresh devices data
      await mutate()

      // Exit edit mode after successful update
      setEditMode(false)
      setSelectedDeviceForEdit(null)

      toast({
        title: "✅ สำเร็จ",
        description: `อัพเดทตำแหน่งอุปกรณ์เรียบร้อยแล้ว (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      })
      
      return data
    } catch (error: any) {
      console.error('Error updating location:', error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัพเดทตำแหน่งได้",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleToggleEditMode = (deviceId?: string) => {
    if (editMode && selectedDeviceForEdit) {
      // Exit edit mode
      setEditMode(false)
      setSelectedDeviceForEdit(null)
    } else if (deviceId) {
      // Enter edit mode for specific device
      setEditMode(true)
      setSelectedDeviceForEdit(deviceId)
      const device = devices?.find(d => d.id === deviceId)
      if (device && device.latitude && device.longitude) {
        setMapCenter({ lat: device.latitude, lng: device.longitude })
        setZoom(15)
      }
      toast({
        title: "โหมดแก้ไข",
        description: "คลิกบนแผนที่เพื่อเลือกตำแหน่งใหม่ หรือลากหมุดเพื่อปรับตำแหน่ง",
      })
    }
  }

  // Handle map center change
  const handleUpdateMapCenter = () => {
    try {
      const [lat, lng] = mapCenterInput.split(',').map(v => parseFloat(v.trim()))
      if (isNaN(lat) || isNaN(lng)) {
        toast({
          title: "ข้อผิดพลาด",
          description: "กรุณากรอกพิกัด เช่น: 13.7563, 100.5018",
          variant: "destructive",
        })
        return
      }
      setMapCenter({ lat, lng })
      setZoom(12)
      setCenterPickMode(false)
      toast({
        title: "สำเร็จ",
        description: "อัพเดทจุดศูนย์กลางแผนที่",
      })
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถแปลงพิกัดได้",
        variant: "destructive",
      })
    }
  }

  // Handle center picked from map
  const handleCenterPicked = (lat: number, lng: number) => {
    setMapCenterInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    setMapCenter({ lat, lng })
    setCenterPickMode(false)
    toast({
      title: "สำเร็จ",
      description: `อัพเดทจุดศูนย์กลางแผนที่เป็น ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    })
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!devices) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">แผนที่อุปกรณ์</h1>
          <p className="text-muted-foreground mt-1">
            ติดตามตำแหน่งและสถานะอุปกรณ์บนแผนที่
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          รีเฟรช
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ฟิลเตอร์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ/จังหวัด"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">ประเภท:</p>
              <div className="flex gap-2">
                <Button 
                  onClick={selectAllTypes}
                  variant="outline" 
                  size="sm"
                  className="h-8 bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  เลือกทั้งหมด
                </Button>
                <Button 
                  onClick={clearAllTypes}
                  variant="outline" 
                  size="sm"
                  className="h-8 bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  ล้างทั้งหมด
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {deviceTypes.map((type) => {
                const isSelected = selectedTypes.includes(type)
                const count = devices?.filter(d => d.type === type).length || 0
                
                // Color scheme based on type
                let colorClass = "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-100"
                if (type.toLowerCase().includes("weather")) {
                  colorClass = "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-100"
                } else if (type.toLowerCase().includes("ecph")) {
                  colorClass = "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-100"
                } else if (type.toLowerCase().includes("ชุดกิจ") || type.toLowerCase().includes("sensor")) {
                  colorClass = "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-100"
                } else if (type.toLowerCase().includes("ตัวมวม") || type.toLowerCase().includes("monitor")) {
                  colorClass = "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-100"
                }

                return (
                  <label
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                      isSelected 
                        ? `${colorClass} ring-2 ring-offset-2 ring-current` 
                        : "bg-muted hover:bg-muted/80 border-border"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTypeFilter(type)}
                    />
                    <span className="text-sm font-medium">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              แสดง <span className="font-semibold text-foreground">{filteredDevices.length}</span> จาก {devices?.length || 0} อุปกรณ์
            </span>
            {(searchQuery || selectedTypes.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedTypes([])
                }}
                className="h-7"
              >
                <X className="w-3 h-3 mr-1" />
                ล้างฟิลเตอร์
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">อุปกรณ์ทั้งหมด</CardTitle>
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDevices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จากทั้งหมด {devices?.length || 0} อุปกรณ์
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">มีตำแหน่งบนแผนที่</CardTitle>
            <MapPin className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDevicesWithLocation.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จากทั้งหมด {devicesWithLocation.length} อุปกรณ์
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ออนไลน์</CardTitle>
            <Wifi className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDevices.filter((d) => d.is_online).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              จากทั้งหมด {devices?.filter(d => d.is_online).length || 0} อุปกรณ์
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ออฟไลน์</CardTitle>
            <WifiOff className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredDevices.filter((d) => !d.is_online).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              จากทั้งหมด {devices?.filter(d => !d.is_online).length || 0} อุปกรณ์
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>แผนที่แสดงตำแหน่งอุปกรณ์</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              📍 อุปกรณ์ที่มีตำแหน่ง: {filteredDevicesWithLocation.length} | 
              📌 จุดศูนย์กลาง: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
            </p>
          </CardHeader>
          <CardContent>
            <div 
              className="h-[600px]"
              style={{
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: `1px solid ${isDarkTheme ? '#404040' : '#e5e5e5'}`,
              }}
            >
              <InteractiveMap
                devices={filteredDevices}
                sensorData={sensorData}
                center={mapCenter}
                zoom={zoom}
                onDeviceClick={handleDeviceClick}
                onLocationUpdate={handleLocationUpdate}
                editMode={editMode}
                selectedDeviceForEdit={selectedDeviceForEdit}
                centerPickMode={centerPickMode}
                onCenterPicked={handleCenterPicked}
              />
            </div>
          </CardContent>
        </Card>

        {/* Device List & Details */}
        <div className="space-y-4">
          {/* Selected Device Details */}
          {selectedDevice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลอุปกรณ์</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{selectedDevice.name}</span>
                    <Badge variant={selectedDevice.is_online ? "default" : "destructive"}>
                      {selectedDevice.is_online ? "ออนไลน์" : "ออฟไลน์"}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">
                      <span className="font-medium">ประเภท:</span> {selectedDevice.type}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">สถานที่:</span> {selectedDevice.location}
                    </p>
                    {selectedDevice.latitude && selectedDevice.longitude && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">พิกัด:</span>{" "}
                        {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sensor Data */}
                {(() => {
                  const sensorInfo = getDeviceSensorData(selectedDevice.id)
                  if (sensorInfo) {
                    return (
                      <div className="pt-3 border-t space-y-2">
                        <p className="text-sm font-semibold">ข้อมูลเซ็นเซอร์</p>
                        {sensorInfo.temperature !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span>อุณหภูมิ: {sensorInfo.temperature}°C</span>
                          </div>
                        )}
                        {sensorInfo.humidity !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span>ความชื้น: {sensorInfo.humidity}%</span>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}

                {/* Battery Level */}
                {selectedDevice.battery_level !== undefined && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Battery className="w-4 h-4" />
                      <span>แบตเตอรี่: {selectedDevice.battery_level}%</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleEditMode(selectedDevice.id)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    แก้ไขตำแหน่ง
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedDevice(null)}
                  >
                    ปิด
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Mode Notice */}
          {editMode && selectedDeviceForEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  🎯 โหมดแก้ไขตำแหน่ง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3">
                    <p className="text-sm font-medium mb-2 text-foreground">
                      📍 อุปกรณ์: <span className="font-bold">{devices?.find(d => d.id === selectedDeviceForEdit)?.name}</span>
                    </p>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold text-foreground">วิธีการใช้งาน:</p>
                    <div className="text-sm text-muted-foreground space-y-1.5">
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🖱️</span>
                        <span>คลิกบนแผนที่เพื่อวางหมุด</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-lg">🔄</span>
                        <span>ลากหมุดเพื่อปรับตำแหน่ง</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-lg">💾</span>
                        <span>กดยืนยันในป๊อปอัพเพื่อบันทึก</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleEditMode()}
                  >
                    <X className="w-4 h-4 mr-2" />
                    ยกเลิกการแก้ไข
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Device Notice */}
          {!editMode && filteredDevicesWithoutLocation.length > 0 && showAddLocationNotice && (
            <Card className="relative">
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-6 w-6 z-10"
      onClick={() => setShowAddLocationNotice(false)}
    >
      <X className="w-4 h-4" />
    </Button>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        📌 เพิ่มตำแหน่งอุปกรณ์
      </CardTitle>
    </CardHeader>
    <CardContent>
        <div className="space-y-3">
            <div className="p-3">
                <p className="text-sm text-foreground">
                    มี <span className="font-bold">{filteredDevicesWithoutLocation.length}</span> อุปกรณ์ที่ยังไม่มีตำแหน่ง
                </p>
                <p className="text-sm text-foreground mt-1">
                    💡 คลิกปุ่ม "เพิ่มตำแหน่ง" ในรายการด้านล่าง
                </p>
            </div>
        </div>
    </CardContent>
</Card>
          )}

          {/* Device List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    รายการอุปกรณ์
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    แสดง {filteredDevices.length} อุปกรณ์
                    {(searchQuery || selectedTypes.length > 0) && (
                      <span className="ml-1 text-primary font-medium">(กรองแล้ว)</span>
                    )}
                  </p>
                </div>
                {editMode && (
                  <Badge variant="default" className="bg-blue-500 animate-pulse">
                    🎯 โหมดแก้ไข
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredDevicesWithLocation.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      มีตำแหน่งบนแผนที่
                    </p>
                    {filteredDevicesWithLocation.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          selectedDevice?.id === device.id
                            ? "bg-accent/30 border-accent ring-2 ring-accent/50 shadow-md"
                            : editMode && selectedDeviceForEdit === device.id
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-500 ring-2 ring-blue-500/50 shadow-lg"
                            : "hover:bg-accent/10 hover:shadow-sm cursor-pointer"
                        }`}
                        onClick={() => handleDeviceClick(device)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {device.is_online ? (
                                <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
                              ) : (
                                <WifiOff className="w-4 h-4 text-destructive" />
                              )}
                              <span className="font-medium text-sm">{device.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {device.location}
                            </p>
                            {editMode && selectedDeviceForEdit === device.id && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-semibold flex items-center gap-1 animate-bounce">
                                <span className="text-base">👉</span>
                                ลากหมุดหรือคลิกบนแผนที่
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant="outline" className="text-xs">
                              {device.type}
                            </Badge>
                            {editMode && selectedDeviceForEdit === device.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleEditMode()
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                ยกเลิก
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredDevicesWithoutLocation.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      ยังไม่มีตำแหน่ง
                    </p>
                    {filteredDevicesWithoutLocation.map((device) => (
                      <div
                        key={device.id}
                        className={`p-3 rounded-lg border transition cursor-pointer ${
                          editMode && selectedDeviceForEdit === device.id
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-500"
                            : "hover:bg-accent/10"
                        }`}
                        onClick={() => {
                          if (!editMode) {
                            handleToggleEditMode(device.id)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{device.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {device.location}
                            </p>
                            {editMode && selectedDeviceForEdit === device.id && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                👆 คลิกบนแผนที่เพื่อปักหมุด
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge variant="outline" className="text-xs">
                              {device.type}
                            </Badge>
                            {editMode && selectedDeviceForEdit === device.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleEditMode()
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                ยกเลิก
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-green-600 hover:text-green-700"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleEditMode(device.id)
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                เพิ่มตำแหน่ง
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredDevices.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map Center Control - ย้ายมาล่างสุด */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            🎯 ตั้งจุดศูนย์กลางแผนที่
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <div className="flex gap-2">
            <Input
              type="text"
              value={mapCenterInput}
              onChange={(e) => setMapCenterInput(e.target.value)}
              placeholder="เช่น: 13.7563, 100.5018"
              className="flex-1"
            />
            <Button 
              onClick={handleUpdateMapCenter}
              variant="default"
              size="sm"
            >
              เปลี่ยน
            </Button>
            <Button 
              onClick={() => {
                setCenterPickMode(!centerPickMode)
                if (!centerPickMode) {
                  toast({
                    title: "โหมดเลือกจุดศูนย์กลาง",
                    description: "คลิกบนแผนที่เพื่อเลือกจุดศูนย์กลาง",
                  })
                }
              }}
              variant={centerPickMode ? "default" : "outline"}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-2 text-xs space-y-1">
            <p className="text-foreground">
              📍 <span className="font-semibold">ปัจจุบัน:</span> {mapCenter.lat.toFixed(5)}, {mapCenter.lng.toFixed(5)}
            </p>
            <p className="text-foreground">
              🔍 <span className="font-semibold">ซูม:</span> {zoom}
            </p>
            {centerPickMode && (
              <p className="text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                👆 คลิกบนแผนที่เพื่อเลือกจุดศูนย์กลาง
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
