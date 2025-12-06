"use client"

import { useDevice, useDeviceData, useAlerts, useDeviceSettings } from "@/lib/hooks/useSWR"
import { useToast } from "@/lib/hooks/useToast"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Power, Power as Power2, AlertCircle, CheckCircle, Radio, Zap, Loader, Trash2, AlertTriangle } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DeviceControlPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()
  const deviceId = searchParams.get("device")

  // Redirect if no device ID
  useEffect(() => {
    if (!deviceId) {
      toast.error("ไม่พบรหัสอุปกรณ์")
      router.push("/admin/devices")
    }
  }, [deviceId, router])

  const { device, isLoading: deviceLoading, mutate: mutateDevice } = useDevice(deviceId ?? null)
  const { data: sensorData } = useDeviceData(deviceId ?? null)
  const { alerts } = useAlerts(deviceId || undefined)
  const { settings, isLoading: settingsLoading, mutate: mutateSettings } = useDeviceSettings(deviceId ?? null)

  const [localDevice, setLocalDevice] = useState<any>(null)
  const [controls, setControls] = useState({
    minThreshold: 20,
    maxThreshold: 30,
    samplingRate: 30,
    alertEnabled: true,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [controlLoading, setControlLoading] = useState<string | null>(null)

  // อัพเดท localDevice เมื่อ device data มาถึง
  useEffect(() => {
    if (device) {
      setLocalDevice(device)
    }
  }, [device])

  // อัพเดท controls เมื่อ settings มาถึง
  useEffect(() => {
    if (settings) {
      setControls({
        minThreshold: settings.min_threshold ?? 20,
        maxThreshold: settings.max_threshold ?? 30,
        samplingRate: settings.update_interval ?? 30,
        alertEnabled: settings.alert_enabled ?? true,
      })
    }
  }, [settings])

  const handleDelete = async () => {
    if (!deviceId || deviceId === "null" || deviceId === "undefined") {
      toast.error("ไม่พบรหัสอุปกรณ์ที่ต้องการลบ")
      setShowDeleteDialog(false)
      return
    }
    
    setDeleting(true)
    try {
      console.log("Deleting device with ID:", deviceId)
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("ลบอุปกรณ์สำเร็จ")
        router.push("/admin/devices")
      } else {
        console.error("Delete failed:", data)
        alert(`ลบอุปกรณ์ไม่สำเร็จ: ${data.error || "Unknown error"}`)
        setDeleting(false)
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
      toast.error("เกิดข้อผิดพลาดในการลบอุปกรณ์")
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleTogglePower = async () => {
    if (!deviceId) return

    setControlLoading("power")
    try {
      const newPowerState = !localDevice?.power
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "power",
          value: newPowerState,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setLocalDevice({ ...localDevice, power: newPowerState })
        mutateDevice()
        alert(newPowerState ? "เปิดอุปกรณ์สำเร็จ" : "ปิดอุปกรณ์สำเร็จ")
      } else {
        toast.error(`ไม่สามารถเปลี่ยนสถานะเปิด/ปิดได้: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to toggle power:", error)
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setControlLoading(null)
    }
  }

  const handleSetThreshold = async () => {
    if (!deviceId) return

    setControlLoading("threshold")
    try {
      console.log("Setting threshold:", {
        min: controls.minThreshold,
        max: controls.maxThreshold,
      })

      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setThreshold",
          value: {
            min: parseFloat(controls.minThreshold as any),
            max: parseFloat(controls.maxThreshold as any),
          },
        }),
      })

      const data = await response.json()
      console.log("Threshold response:", data)

      if (response.ok && data.success) {
        toast.success("บันทึกการตั้งค่าเรียบร้อย")
        mutateSettings() // รีเฟรชค่า settings
      } else {
        console.error("Failed to set threshold:", data)
        toast.error(`ไม่สามารถบันทึกการตั้งค่าได้: ${data.error || data.details || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to set threshold:", error)
      toast.error("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "Unknown"))
    } finally {
      setControlLoading(null)
    }
  }

  const handleSaveAllSettings = async () => {
    if (!deviceId) return

    setControlLoading("settings")
    try {
      console.log("Saving all settings:", controls)

      // บันทึก threshold
      const thresholdResponse = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setThreshold",
          value: {
            min: parseFloat(controls.minThreshold as any),
            max: parseFloat(controls.maxThreshold as any),
          },
        }),
      })

      const thresholdData = await thresholdResponse.json()
      console.log("Threshold response:", thresholdData)

      if (!thresholdResponse.ok) {
        throw new Error(thresholdData.error || thresholdData.details || "Failed to save threshold")
      }

      // บันทึก alert enabled status
      const alertResponse = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setAlertEnabled",
          value: controls.alertEnabled,
        }),
      })

      const alertData = await alertResponse.json()
      console.log("Alert response:", alertData)

      if (!alertResponse.ok) {
        throw new Error(alertData.error || alertData.details || "Failed to save alert settings")
      }

      // บันทึก sampling rate
      const samplingResponse = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setSamplingRate",
          value: controls.samplingRate,
        }),
      })

      const samplingData = await samplingResponse.json()
      console.log("Sampling response:", samplingData)

      if (!samplingResponse.ok) {
        throw new Error(samplingData.error || samplingData.details || "Failed to save sampling rate")
      }

      toast.success("บันทึกการตั้งค่าทั้งหมดเรียบร้อย")
      mutateSettings()
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("เกิดข้อผิดพลาด: " + (error instanceof Error ? error.message : "Unknown"))
    } finally {
      setControlLoading(null)
    }
  }

  if (deviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  if (!localDevice) {
    return (
      <div className="p-8">
        <p className="text-foreground/60">ไม่พบอุปกรณ์</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/devices">
            <Button variant="ghost" className="text-foreground/60 hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{localDevice.name}</h1>
            <p className="text-foreground/60">{localDevice.type} • {localDevice.location || "ไม่ระบุตำแหน่ง"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="bg-destructive/20 text-destructive hover:bg-destructive/30 gap-2"
          onClick={() => setShowDeleteDialog(true)}
          disabled={!deviceId || !device}
        >
          <Trash2 className="w-4 h-4" />
          ลบอุปกรณ์
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Device Status Card */}
          <Card className="p-8 bg-card border-border">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">สถานะอุปกรณ์</h2>
                <p className="text-foreground/60">ข้อมูลที่ส่งโดย: {localDevice.last_update || "ไม่มีข้อมูล"}</p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  localDevice.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                }`}
              >
                <Radio className="w-4 h-4 animate-pulse" />
                {localDevice.is_active ? "ออนไลน์" : "ออฟไลน์"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-background p-6 rounded-lg border border-border">
                <p className="text-foreground/60 text-sm mb-2">ค่าปัจจุบัน</p>
                <p className="text-4xl font-bold text-accent">
                  {sensorData && sensorData.length > 0 ? sensorData[sensorData.length - 1].value : "ไม่มีข้อมูล"}
                  <span className="text-xl ml-2">{localDevice.unit}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-lg border border-border">
                  <p className="text-foreground/60 text-xs mb-2">แบตเตอรี่</p>
                  <p className="text-2xl font-bold text-accent">{localDevice.battery_level}%</p>
                </div>
                <div className="bg-background p-4 rounded-lg border border-border">
                  <p className="text-foreground/60 text-xs mb-2">สัญญาณ</p>
                  <p className="text-2xl font-bold text-accent">{localDevice.signal_strength}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "ตำแหน่ง", value: localDevice.location },
                { label: "Uptime", value: localDevice.uptime },
                { label: "ประเภท", value: localDevice.type },
              ].map((item, idx) => (
                <div key={idx} className="bg-background p-4 rounded-lg border border-border">
                  <p className="text-foreground/60 text-xs mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={handleTogglePower}
              disabled={controlLoading === "power"}
              className={`w-full h-12 gap-2 text-base font-medium ${
                localDevice.power
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
              }`}
              variant="ghost"
            >
              {controlLoading === "power" ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : localDevice.power ? (
                <>
                  <Power className="w-5 h-5" />
                  ปิดอุปกรณ์
                </>
              ) : (
                <>
                  <Power2 className="w-5 h-5" />
                  เปิดอุปกรณ์
                </>
              )}
            </Button>
          </Card>

          {/* Real-time Chart */}
          {sensorData && sensorData.length > 0 && (
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">กราฟการใช้พลังงานแบบเรียลไทม์</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={sensorData.slice(0, 24).map((d: any) => ({
                    time: new Date(d.timestamp).toLocaleTimeString(),
                    value: d.value,
                  }))}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-foreground)" opacity={0.5} />
                  <YAxis stroke="var(--color-foreground)" opacity={0.5} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-accent)"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Control Settings */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">ตั้งค่าการควบคุม</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ขีดจำกัดต่ำสุด: {controls.minThreshold}°C
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.1"
                    value={controls.minThreshold}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        minThreshold: Number.parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={controls.minThreshold}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        minThreshold: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ขีดจำกัดสูงสุด: {controls.maxThreshold}°C
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="30"
                    max="50"
                    step="0.1"
                    value={controls.maxThreshold}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        maxThreshold: Number.parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={controls.maxThreshold}
                    onChange={(e) =>
                      setControls({
                        ...controls,
                        maxThreshold: Number.parseFloat(e.target.value) || 30,
                      })
                    }
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  อัตราการสุ่มตัวอย่าง: {controls.samplingRate} วินาที
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={controls.samplingRate}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      samplingRate: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="alertEnabled"
                  checked={controls.alertEnabled}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      alertEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="alertEnabled" className="text-sm font-medium text-foreground">
                  เปิดใช้งานการแจ้งเตือน
                </label>
              </div>
              <Button 
                onClick={handleSaveAllSettings} 
                disabled={controlLoading === "settings"}
                className="w-full bg-accent text-background hover:bg-accent/90"
              >
                {controlLoading === "settings" ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการตั้งค่า"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">สถิติด่วน</h3>
            <div className="space-y-4">
              {[
                { label: "ค่าเฉลี่ย", value: "25.8°C", icon: Zap },
                { label: "ค่าสูงสุด", value: "28.5°C", icon: Zap },
                { label: "ค่าต่ำสุด", value: "22.5°C", icon: Zap },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm text-foreground/60">{stat.label}</span>
                  </div>
                  <span className="font-semibold text-accent">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">การแจ้งเตือนล่าสุด</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="p-3 rounded-lg bg-background border border-border">
                  <div className="flex items-start gap-2">
                    {alert.type === "success" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    {alert.type === "warning" && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                    {alert.type === "info" && <Radio className="w-4 h-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-foreground/50 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Device Info */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">ข้อมูลอุปกรณ์</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">ID:</span>
                <span className="font-medium text-foreground">{localDevice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">สถานะ:</span>
                <span className={`font-medium ${localDevice.is_active ? "text-green-500" : "text-red-500"}`}>
                  {localDevice.is_active ? "ออนไลน์" : "ออฟไลน์"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">โหมด:</span>
                <span className="font-medium text-foreground">{localDevice.power ? "เปิด" : "ปิด"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              ยืนยันการลบอุปกรณ์
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบอุปกรณ์ <strong>{localDevice.name}</strong>?
              <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้ และข้อมูลทั้งหมดของอุปกรณ์นี้จะถูกลบถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  กำลังลบ...
                </>
              ) : (
                "ลบอุปกรณ์"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
