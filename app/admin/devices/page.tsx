"use client"

import { useDevices } from "@/lib/hooks/useSWR"
import { useDeviceFull } from "@/lib/hooks/useDeviceFull"
import { useState, useEffect } from "react"
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
import { Plus, Settings, Trash2, Power, PowerOff, Loader, Copy, Check, Eye, EyeOff, Sliders, Grid3x3, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { DeviceCustomizationDialog } from "@/components/admin/dialogs/device-customization-dialog"
import { CustomDeviceWidget } from "@/components/admin/widgets/custom-device-widget"

export default function DevicesPage() {
  const { devices, isLoading, error, mutate } = useDevices()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
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
  
  // State สำหรับ Device Customization
  const [customizingDevice, setCustomizingDevice] = useState<any>(null)
  
  // State สำหรับ View Mode (list or widget)
  const [viewMode, setViewMode] = useState<"list" | "widget">("list")

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
      alert("ไม่พบรหัสอุปกรณ์ที่ต้องการลบ")
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
        alert("ลบอุปกรณ์สำเร็จ")
      } else {
        console.error("Delete failed:", data)
        alert(`ลบอุปกรณ์ไม่สำเร็จ: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
      alert("เกิดข้อผิดพลาดในการลบอุปกรณ์")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
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
        
        <div className="flex gap-3">
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
                          alert('สร้างอุปกรณ์ไม่สำเร็จ')
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
      {devices && devices.length > 0 ? (
        <>
          {viewMode === "widget" ? (
            /* Widget View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device: any) => (
                <CustomDeviceWidget
                  key={device.id}
                  device={device}
                  onCustomize={() => setCustomizingDevice(device)}
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
          {devices.map((device: any) => (
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
                  onClick={() => setCustomizingDevice(device)}
                  className="gap-2 bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                  variant="ghost"
                  title="ปรับแต่ง Widget"
                >
                  <Sliders className="w-4 h-4" />
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
      ) : (
        <div className="text-center py-16 text-foreground/60">
          <p className="mb-4">ไม่มีอุปกรณ์ที่ลงทะเบียน</p>
          <Button onClick={() => setOpen(true)} className="bg-accent text-background hover:bg-accent/90 gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มอุปกรณ์แรกของคุณ
          </Button>
        </div>
      )}

      {/* Device Customization Dialog */}
      {customizingDevice && (
        <DeviceCustomizationDialog
          open={!!customizingDevice}
          onOpenChange={(open: boolean) => !open && setCustomizingDevice(null)}
          device={customizingDevice}
          onSave={() => {
            mutate()
            setCustomizingDevice(null)
          }}
        />
      )}
    </div>
  )
}