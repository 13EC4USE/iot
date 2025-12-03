"use client"

import { useDevice, useDeviceData, useAlerts } from "@/lib/hooks/useSWR"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Power, Power as Power2, AlertCircle, CheckCircle, Radio, Zap, Loader } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import Link from "next/link"
import { MqttService } from "@/lib/mqtt/mqtt-service"

export default function DeviceControlPage() {
  const searchParams = useSearchParams()
  const deviceId = searchParams.get("device")

  const { device, isLoading: deviceLoading } = useDevice(deviceId)
  const { data: sensorData } = useDeviceData(deviceId)
  const { alerts } = useAlerts(deviceId)

  const [localDevice, setLocalDevice] = useState<any>(null)
  const [controls, setControls] = useState({
    minThreshold: 20,
    maxThreshold: 30,
    samplingRate: 30,
    alertEnabled: true,
  })

  useEffect(() => {
    if (device) {
      setLocalDevice(device)
    }
  }, [device])

  useEffect(() => {
    if (deviceId) {
      MqttService.subscribeToDevice(deviceId, (data) => {
        console.log("MQTT data received:", data)
      })
    }
  }, [deviceId])

  const handleTogglePower = async () => {
    if (!deviceId) return

    try {
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "power",
          value: !localDevice?.power,
        }),
      })

      if (response.ok) {
        setLocalDevice({ ...localDevice, power: !localDevice.power })
      }
    } catch (error) {
      console.error("Failed to toggle power:", error)
    }
  }

  const handleSetThreshold = async () => {
    if (!deviceId) return

    try {
      const response = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "setThreshold",
          value: {
            min: controls.minThreshold,
            max: controls.maxThreshold,
          },
        }),
      })

      if (response.ok) {
        console.log("Threshold updated successfully")
      }
    } catch (error) {
      console.error("Failed to set threshold:", error)
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/devices">
          <Button variant="ghost" className="text-foreground/60 hover:text-foreground gap-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{localDevice.name}</h1>
          <p className="text-foreground/60">{localDevice.type}</p>
        </div>
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
              className={`w-full h-12 gap-2 text-base font-medium ${
                localDevice.power
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
              }`}
              variant="ghost"
            >
              {localDevice.power ? (
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
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={controls.minThreshold}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      minThreshold: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ขีดจำกัดสูงสุด: {controls.maxThreshold}°C
                </label>
                <input
                  type="range"
                  min="30"
                  max="50"
                  value={controls.maxThreshold}
                  onChange={(e) =>
                    setControls({
                      ...controls,
                      maxThreshold: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
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
              <Button onClick={handleSetThreshold} className="w-full bg-accent text-background hover:bg-accent/90">
                บันทึกการตั้งค่า
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
              {alerts.map((alert) => (
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
    </div>
  )
}
