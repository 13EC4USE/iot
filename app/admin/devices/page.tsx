"use client"

import { useDevices } from "@/lib/hooks/useSWR"
import { useDeviceFull } from "@/lib/hooks/useDeviceFull"
import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Settings, Trash2, Power, PowerOff, Loader, Copy, Check, Eye, EyeOff, Grid3x3, LayoutGrid, Search, Filter, SortAsc, X, MapPin } from "lucide-react"
import Link from "next/link"
import { CustomDeviceWidget } from "@/components/admin/widgets/custom-device-widget"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Inline LocationMapPicker to avoid TypeScript module resolution issues
const LocationMapPicker = dynamic(
  () => Promise.resolve().then(() => {
    const { MapContainer, TileLayer, Marker, useMapEvents } = require("react-leaflet")
    require("leaflet/dist/leaflet.css")
    
    if (typeof window !== "undefined") {
      const L = require("leaflet")
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
    }
    
    function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
      useMapEvents({
        click: (e: any) => {
          onClick(e.latlng.lat, e.latlng.lng)
        },
      })
      return null
    }
    
    return {
      default: function LocationMapPicker({ 
        lat, 
        lng, 
        onLocationChange 
      }: { 
        lat: string
        lng: string
        onLocationChange: (lat: string, lng: string) => void 
      }) {
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
                onClick={(clickLat: number, clickLng: number) => {
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
    }
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-lg border border-border flex items-center justify-center bg-muted">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    )
  }
)

export default function DevicesPage() {
  const { devices, isLoading, error, mutate } = useDevices()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showFilters, setShowFilters] = useState(false)
  
  // Check admin status on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.user?.email === "foolkzaza@gmail.com") {
          setIsAdmin(true)
        }
      })
      .catch(console.error)
  }, [])
  
  // State สำหรับ Dialog
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // State สำหรับฟอร์ม
  const [form, setForm] = useState({ name: "", type: "other", location: "", mac_address: "", mqtt_topic: "" })
  
  // State ใหม่! สำหรับเก็บ Credentials ที่ได้จาก Backend
  const [createdCredentials, setCreatedCredentials] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  // State สำหรับ Location Editing
  const [editingLocationDevice, setEditingLocationDevice] = useState<any>(null)
  const [editingLatLng, setEditingLatLng] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" })
  const [updatingLocation, setUpdatingLocation] = useState(false)
  
  // State สำหรับ View Mode (list or widget)
  const [viewMode, setViewMode] = useState<"list" | "widget">("list")

  // Toast for notifications
  const { toast } = useToast()

  // ฟังก์ชันช่วย Copy ข้อมูล
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // รีเซ็ตฟอร์มเมื่อปิด Dialog
  const handleCloseDialog = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setCreatedCredentials(null)
        setForm({ name: "", type: "other", location: "", mac_address: "", mqtt_topic: "" })
      }, 300)
    }
  }

  const handleTogglePower = async (deviceId: string, currentPower: boolean) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "power", value: !currentPower }),
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Failed to toggle power:", error)
    }
  }

  const handleDelete = async (deviceId: string) => {
    console.log("handleDelete called with deviceId:", deviceId, "type:", typeof deviceId)
    
    if (!deviceId || deviceId === "undefined" || deviceId === "null") {
      toast({
        title: "❌ ข้อผิดพลาด",
        description: "ไม่พบรหัสอุปกรณ์ที่ต้องการลบ",
        variant: "destructive",
      })
      return
    }

    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return
    }

    setDeleting(deviceId)
    try {
      console.log("Sending DELETE request to:", `/api/devices/${deviceId}`)
      const response = await fetch(`/api/devices/${deviceId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        mutate()
        toast({
          title: "✅ สำเร็จ",
          description: "ลบอุปกรณ์เรียบร้อยแล้ว",
        })
      } else {
        console.error("Delete failed:", data)
        toast({
          title: "❌ ลบไม่สำเร็จ",
          description: data.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบอุปกรณ์ได้",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  // Handle location update
  const handleLocationUpdate = async () => {
    if (!editingLocationDevice || !editingLatLng.lat || !editingLatLng.lng) {
      toast({
        title: "⚠️ ข้อมูลไม่ครบ",
        description: "กรุณากรอก Latitude และ Longitude",
        variant: "destructive",
      })
      return
    }

    setUpdatingLocation(true)
    try {
      const response = await fetch(`/api/devices/${editingLocationDevice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(editingLatLng.lat),
          longitude: parseFloat(editingLatLng.lng),
        }),
      })

      if (response.ok) {
        mutate()
        toast({
          title: "✅ สำเร็จ",
          description: `บันทึกตำแหน่งเรียบร้อยแล้ว (${editingLatLng.lat}, ${editingLatLng.lng})`,
        })
        setEditingLocationDevice(null)
        setEditingLatLng({ lat: "", lng: "" })
      } else {
        const data = await response.json()
        console.error("Location update failed:", data)
        toast({
          title: "❌ บันทึกไม่สำเร็จ",
          description: data.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update location:", error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกตำแหน่งได้",
        variant: "destructive",
      })
    } finally {
      setUpdatingLocation(false)
    }
  }

  // Open location editor
  const openLocationEditor = (device: any) => {
    setEditingLocationDevice(device)
    setEditingLatLng({
      lat: device.latitude?.toString() || "",
      lng: device.longitude?.toString() || "",
    })
  }

  // Memoize filter and sort logic - only recalculate when filters change
  const filteredAndSortedDevices = useMemo(() => {
    return devices
      ?.filter((device: any) => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesSearch = 
            device.name?.toLowerCase().includes(query) ||
            device.type?.toLowerCase().includes(query) ||
            device.location?.toLowerCase().includes(query) ||
            device.mac_address?.toLowerCase().includes(query)
          if (!matchesSearch) return false
        }

        // Type filter
        if (filterType !== "all" && device.type !== filterType) {
          return false
        }

        // Status filter
        if (filterStatus !== "all") {
          const isOnline = device.is_active && device.last_update && 
            (new Date().getTime() - new Date(device.last_update).getTime() < 5 * 60 * 1000)
          if (filterStatus === "online" && !isOnline) return false
          if (filterStatus === "offline" && isOnline) return false
          if (filterStatus === "active" && !device.is_active) return false
          if (filterStatus === "inactive" && device.is_active) return false
        }

        return true
      })
      .sort((a: any, b: any) => {
        let compareValue = 0
        
        switch (sortBy) {
          case "name":
            compareValue = (a.name || "").localeCompare(b.name || "")
            break
          case "type":
            compareValue = (a.type || "").localeCompare(b.type || "")
            break
          case "location":
            compareValue = (a.location || "").localeCompare(b.location || "")
            break
          case "lastUpdate":
            compareValue = new Date(b.last_update || 0).getTime() - new Date(a.last_update || 0).getTime()
            break
          case "battery":
            compareValue = (b.battery_level || 0) - (a.battery_level || 0)
            break
          default:
            break
        }

        return sortOrder === "asc" ? compareValue : -compareValue
      })
  }, [devices, searchQuery, filterType, filterStatus, sortBy, sortOrder])

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterStatus("all")
    setSortBy("name")
    setSortOrder("asc")
  }

  const displayDevices = filteredAndSortedDevices || devices

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">จัดการอุปกรณ์</h1>
            {isAdmin && (
              <Badge variant="destructive" className="text-xs font-bold">
                🔐 ADMIN MODE
              </Badge>
            )}
          </div>
          <p className="text-foreground/60">
            {isAdmin ? "กำลังดูอุปกรณ์ทั้งหมดในระบบ" : "เพิ่ม ลบ และควบคุมอุปกรณ์ IoT ของคุณ"}
          </p>
        </div>
        
        <div className="flex gap-2 md:gap-3 flex-wrap">
          {/* Filter Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">ตัวกรอง</span>
            {(searchQuery || filterType !== "all" || filterStatus !== "all" || sortBy !== "name") && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              รายการ
            </Button>
            <Button
              size="sm"
              variant={viewMode === "widget" ? "default" : "ghost"}
              onClick={() => setViewMode("widget")}
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Widget
            </Button>
          </div>
          
          <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-background hover:bg-accent/90 gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มอุปกรณ์
              </Button>
            </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            {!createdCredentials ? (
              /* --- PHASE 1: ฟอร์มกรอกข้อมูล --- */
              <>
                <DialogHeader>
                  <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
                  <DialogDescription>ระบบจะสร้างรหัสเชื่อมต่อ (MQTT Credentials) ให้โดยอัตโนมัติ</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-2">
                  <div>
                    <Label>ชื่ออุปกรณ์</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ไฟห้องนอน" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>ประเภท</Label>
                        <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="motion">Motion</option>
                        <option value="light">Light</option>
                        <option value="switch">Switch</option>
                        <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <Label>ตำแหน่ง</Label>
                        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="เช่น ชั้น 2" />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">💡 เคล็ดลับ</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      หลังจากสร้างอุปกรณ์เสร็จ คุณสามารถไปที่เมนู &quot;แผนที่&quot; เพื่อปักหมุดตำแหน่งบนแผนที่ได้
                    </p>
                  </div>
                  <div>
                    <Label>หมายเหตุ (Optional)</Label>
                    <Input value={form.mqtt_topic} onChange={(e) => setForm({ ...form, mqtt_topic: e.target.value })} placeholder="คำอธิบายเพิ่มเติม" />
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
                  <Button
                    onClick={async () => {
                      setCreating(true)
                      try {
                        const res = await fetch('/api/devices', { // หรือ path API ของคุณ
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(form),
                        })

                        const data = await res.json()

                        if (res.ok) {
                          mutate() // รีเฟรชลิสต์ข้างหลัง
                          // สำคัญ: เซ็ตค่า Credential เพื่อเปลี่ยนหน้าจอ Dialog
                          setCreatedCredentials(data.data) 
                        } else {
                          console.error('Failed to create device', data)
                          toast({
                            title: "❌ สร้างอุปกรณ์ไม่สำเร็จ",
                            description: data.error || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ",
                            variant: "destructive",
                          })
                        }
                      } catch (err) {
                        console.error(err)
                      } finally {
                        setCreating(false)
                      }
                    }}
                    disabled={creating || !form.name}
                    className="bg-accent text-background hover:bg-accent/90"
                  >
                    {creating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                    {creating ? 'กำลังสร้าง...' : 'สร้างและรับรหัส'}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              /* --- PHASE 2: แสดงผลลัพธ์ (CREDENTIALS) --- */
              <>
                <DialogHeader>
                  <DialogTitle className="text-green-500 flex items-center gap-2">
                    <Check className="w-5 h-5" /> สร้างอุปกรณ์สำเร็จ!
                  </DialogTitle>
                  <DialogDescription>
                    นำค่าเหล่านี้ไปใส่ในโค้ด ESP32 ของคุณ (ไฟล์ secrets.h)
                  </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 p-4 rounded-lg space-y-4 mt-2 border border-border">
                   {/* Host */}
                   <div className="space-y-1">
                    <Label className="text-xs text-foreground/60">MQTT Host</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-background p-2 rounded border border-border text-sm font-mono">
                        {createdCredentials.Host || "localhost"}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.Host || "localhost", "host")}>
                        {copiedField === "host" ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                      </Button>
                    </div>
                  </div>

                  {/* Client ID */}
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/60">Client ID</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-background p-2 rounded border border-border text-sm font-mono truncate">
                        {createdCredentials.ClientID}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.ClientID, "clientid")}>
                        {copiedField === "clientid" ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                      </Button>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/60">Username (Token)</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-background p-2 rounded border border-border text-sm font-mono">
                        {createdCredentials.Username}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.Username, "user")}>
                         {copiedField === "user" ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                      </Button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label className="text-xs text-foreground/60">Password (Secret)</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-background p-2 rounded border border-border text-sm font-mono text-accent break-all">
                        {createdCredentials.Password}
                      </code>
                      <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.Password, "pass")}>
                        {copiedField === "pass" ? <Check className="w-3 h-3 text-green-500"/> : <Copy className="w-3 h-3"/>}
                      </Button>
                    </div>
                    <p className="text-[10px] text-red-400 mt-1">*โปรดบันทึกไว้ ระบบจะไม่แสดงรหัสผ่านนี้อีก</p>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button className="w-full" onClick={() => handleCloseDialog(false)}>
                    ปิดหน้าต่าง
                  </Button>
                </DialogFooter>
              </>
            )}
            
            <DialogClose />
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 mb-6 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label className="text-sm mb-2 block">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ชื่อ, ประเภท, ตำแหน่ง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Label className="text-sm mb-2 block">ประเภทอุปกรณ์</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="humidity">Humidity</SelectItem>
                  <SelectItem value="motion">Motion</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="switch">Switch</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm mb-2 block">สถานะ</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="online">ออนไลน์</SelectItem>
                  <SelectItem value="offline">ออฟไลน์</SelectItem>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <Label className="text-sm mb-2 block">เรียงตาม</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">ชื่อ</SelectItem>
                    <SelectItem value="type">ประเภท</SelectItem>
                    <SelectItem value="location">ตำแหน่ง</SelectItem>
                    <SelectItem value="lastUpdate">อัปเดตล่าสุด</SelectItem>
                    <SelectItem value="battery">แบตเตอรี่</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? "เรียงจากน้อยไปมาก" : "เรียงจากมากไปน้อย"}
                >
                  <SortAsc className={`w-4 h-4 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || filterType !== "all" || filterStatus !== "all" || sortBy !== "name" || sortOrder !== "asc") && (
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                ล้างตัวกรอง
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Results Count */}
      {displayDevices && displayDevices.length !== devices?.length && (
        <div className="mb-4 text-sm text-muted-foreground">
          พบ {displayDevices.length} จาก {devices?.length} อุปกรณ์
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-6 h-6 text-accent animate-spin" />
          <span className="ml-2 text-foreground/60">กำลังโหลดอุปกรณ์...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-8">
          เกิดข้อผิดพลาดในการโหลดอุปกรณ์
        </div>
      )}

      {/* --- ส่วนแสดงรายการ Device --- */}
      {displayDevices && displayDevices.length > 0 ? (
        <>
          {viewMode === "widget" ? (
            /* Widget View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayDevices.map((device: any) => (
                <CustomDeviceWidget
                  key={device.id}
                  device={device}
                  onCustomize={() => window.location.href = `/admin/control?device=${device.id}`}
                  onControl={(action) => {
                    if (action === "on" || action === "off") {
                      handleTogglePower(device.id, action === "off")
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            /* List View Mode (Original) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayDevices.map((device: any) => (
            <Card key={device.id} className="p-6 bg-card border-border hover:border-accent/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{device.name}</h3>
                  <p className="text-sm text-foreground/60">{device.type}</p>
                </div>
                {(() => {
                  const online = device.status_online ?? device.is_active
                  const badgeColor = online ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  const lastSeenText = device.status_last_seen
                    ? new Date(device.status_last_seen).toLocaleString()
                    : "ไม่พบข้อมูล"
                  return (
                    <div className="text-right space-y-1">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${badgeColor}`}>
                        {online ? "● ออนไลน์" : "● ออฟไลน์"}
                      </div>
                      <div className="text-[11px] text-foreground/60">
                        ล่าสุด: {lastSeenText}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">ตำแหน่ง:</span>
                  <span className="text-sm font-medium text-foreground">{device.location || "ไม่ระบุ"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">Client ID:</span>
                  <span className="text-sm font-medium text-foreground font-mono">
                    {device.client_id ? (device.client_id.substring(0, 10) + "...") : "-"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => openLocationEditor(device)}
                  className="gap-2 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                  variant="ghost"
                  title="ตั้งค่าตำแหน่ง"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleTogglePower(device.id, device.power)}
                  disabled={deleting === device.id}
                  className={`flex-1 gap-2 ${
                    device.power
                      ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                  }`}
                  variant="ghost"
                >
                  {device.power ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  {device.power ? "ปิด" : "เปิด"}
                </Button>
                <Link href={`/admin/control?device=${device.id}`} className="flex-1">
                  <Button className="w-full gap-2 bg-primary/20 text-primary hover:bg-primary/30" variant="ghost">
                    <Settings className="w-4 h-4" />
                    ควบคุม
                  </Button>
                </Link>
                <Button
                  onClick={() => handleDelete(device.id)}
                  disabled={deleting === device.id}
                  className="gap-2 bg-destructive/20 text-destructive hover:bg-destructive/30"
                  variant="ghost"
                >
                  {deleting === device.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
            </div>
          )}
        </>
      ) : displayDevices && displayDevices.length === 0 && (searchQuery || filterType !== "all" || filterStatus !== "all") ? (
        <div className="text-center py-16 text-foreground/60">
          <p className="mb-4">ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            ล้างตัวกรอง
          </Button>
        </div>
      ) : (
        <div className="text-center py-16 text-foreground/60">
          <p className="mb-4">ไม่มีอุปกรณ์ที่ลงทะเบียน</p>
          <Button onClick={() => setOpen(true)} className="bg-accent text-background hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มอุปกรณ์แรกของคุณ
          </Button>
        </div>
      )}

      {/* Location Edit Dialog */}
      <Dialog open={!!editingLocationDevice} onOpenChange={(open) => !open && setEditingLocationDevice(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตั้งค่าตำแหน่ง - {editingLocationDevice?.name}</DialogTitle>
            <DialogDescription>
              คลิกบนแผนที่เพื่อปักหมุด หรือกรอก Latitude และ Longitude
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Map */}
            <LocationMapPicker
              lat={editingLatLng.lat}
              lng={editingLatLng.lng}
              onLocationChange={(lat: string, lng: string) => {
                setEditingLatLng({ lat, lng })
              }}
            />

            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="เช่น 13.7563"
                  value={editingLatLng.lat}
                  onChange={(e) => setEditingLatLng({ ...editingLatLng, lat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="เช่น 100.5018"
                  value={editingLatLng.lng}
                  onChange={(e) => setEditingLatLng({ ...editingLatLng, lng: e.target.value })}
                />
              </div>
            </div>

            {/* Quick Location Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingLatLng({ lat: "13.7563", lng: "100.5018" })}
              >
                📍 กรุงเทพฯ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingLatLng({ lat: "18.7883", lng: "98.9853" })}
              >
                📍 เชียงใหม่
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingLatLng({ lat: "7.8804", lng: "98.3923" })}
              >
                📍 ภูเก็ต
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button 
              onClick={handleLocationUpdate}
              disabled={updatingLocation || !editingLatLng.lat || !editingLatLng.lng}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {updatingLocation ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
