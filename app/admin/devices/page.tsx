"use client"

import { useDevices } from "@/lib/hooks/useSWR"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Plus, Settings, Trash2, Power, PowerOff, Loader } from "lucide-react"
import Link from "next/link"

export default function DevicesPage() {
  const { devices, isLoading, error, mutate } = useDevices()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", type: "other", location: "", mac_address: "", mqtt_topic: "" })
  const [creating, setCreating] = useState(false)

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
    setDeleting(deviceId)
    try {
      const response = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">จัดการอุปกรณ์</h1>
          <p className="text-foreground/60">เพิ่ม ลบ และควบคุมอุปกรณ์ IoT ของคุณ</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-background hover:bg-accent/90 gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มอุปกรณ์
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
              <DialogDescription>กรอกข้อมูลอุปกรณ์เพื่อลงทะเบียน</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div>
                <Label>ชื่ออุปกรณ์</Label>
                <Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>ประเภท</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="temperature">temperature</option>
                  <option value="humidity">humidity</option>
                  <option value="motion">motion</option>
                  <option value="light">light</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div>
                <Label>ตำแหน่ง</Label>
                <Input value={form.location} onChange={(e: any) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>MAC Address</Label>
                <Input value={form.mac_address} onChange={(e: any) => setForm({ ...form, mac_address: e.target.value })} />
              </div>
              <div>
                <Label>MQTT Topic</Label>
                <Input value={form.mqtt_topic} onChange={(e: any) => setForm({ ...form, mqtt_topic: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button
                onClick={async () => {
                  setCreating(true)
                  try {
                    const res = await fetch('/api/devices', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(form),
                    })

                    if (res.ok) {
                      mutate()
                      setOpen(false)
                      setForm({ name: "", type: "other", location: "", mac_address: "", mqtt_topic: "" })
                    } else {
                      console.error('Failed to create device', await res.text())
                    }
                  } catch (err) {
                    console.error(err)
                  } finally {
                    setCreating(false)
                  }
                }}
                disabled={creating}
              >
                {creating ? 'กำลังสร้าง...' : 'สร้างอุปกรณ์'}
              </Button>
            </DialogFooter>

            <DialogClose />
          </DialogContent>
        </Dialog>
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

      {devices && devices.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map((device: any) => (
            <Card key={device.id} className="p-6 bg-card border-border hover:border-accent/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{device.name}</h3>
                  <p className="text-sm text-foreground/60">{device.type}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    device.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {device.is_active ? "● ออนไลน์" : "● ออฟไลน์"}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">ตำแหน่ง:</span>
                  <span className="text-sm font-medium text-foreground">{device.location || "ไม่ระบุ"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">MAC Address:</span>
                  <span className="text-sm font-medium text-foreground font-mono">
                    {device.mac_address?.substring(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">แบตเตอรี่:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${device.battery_level}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">{device.battery_level}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
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
                  className="flex-1 gap-2 bg-destructive/20 text-destructive hover:bg-destructive/30"
                  variant="ghost"
                >
                  {deleting === device.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  ลบ
                </Button>
              </div>
            </Card>
          ))}
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
    </div>
  )
}
