"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader, RefreshCw, Power, Zap, Activity, Settings as SettingsIcon } from "lucide-react"
import { TrafficChart } from "@/components/admin/charts/traffic-chart"
import { OnlineHistoryChart } from "@/components/admin/charts/online-history-chart"
import { DonutChart } from "@/components/admin/charts/donut-chart"
import { SystemHealthWidget } from "@/components/admin/widgets/system-health-widget"
import { RecentLogsWidget } from "@/components/admin/widgets/recent-logs-widget"
import { GlobalSettingsDialog } from "@/components/admin/dialogs/global-settings-dialog"
import { DeviceCustomizationDialog } from "@/components/admin/dialogs/device-customization-dialog"
import { useToast } from "@/lib/hooks/useToast"

interface SummaryStats {
  total: number
  online: number
  offline: number
  messagesToday: number
  isAdmin?: boolean
}

interface RecentDevice {
  id: string
  name: string
  type: string
  location: string | null
  is_active: boolean | null
  last_update: string | null
  updated_at: string | null
  created_at: string
  battery_level: number | null
  signal_strength: number | null
  lastData: {
    value: number | null
    unit: string | null
    temperature: number | null
    humidity: number | null
    ammonia_ppm: number | null
    calibrated_ro: number | null
    station_id: string | null
    timestamp: string
  } | null
}

function formatRelative(ts?: string | null) {
  if (!ts) return "ไม่พบข้อมูล"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return "ไม่พบข้อมูล"
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "ไม่กี่วินาทีที่แล้ว"
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} ชม.ที่แล้ว`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} วันที่แล้ว`
}

// SWR fetcher
const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customizingDevice, setCustomizingDevice] = useState<RecentDevice | null>(null)
  const toast = useToast()

  // Use SWR for summary stats - refresh every 10 seconds for development
  const { data: statsData, error: statsError, isLoading: statsLoading, mutate: mutateSummary } = useSWR(
    "/api/stats/summary",
    fetcher,
    {
      revalidateOnFocus: true, // Enable refresh on window focus
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      refreshInterval: 10000, // 10 seconds - for development
      errorRetryCount: 2,
      errorRetryInterval: 30000,
    }
  )

  // Use SWR for recent devices - refresh every 10 seconds for development
  const { data: devicesData, error: devicesError, isLoading: devicesLoading, mutate: mutateDevices } = useSWR(
    "/api/devices/recent?limit=5&offset=0",
    fetcher,
    {
      revalidateOnFocus: true, // Enable refresh on window focus
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      refreshInterval: 10000, // 10 seconds - for development
      errorRetryCount: 2,
      errorRetryInterval: 30000,
    }
  )

  const stats: SummaryStats = statsData || {
    total: 0,
    online: 0,
    offline: 0,
    messagesToday: 0,
    isAdmin: false
  }

  const recentDevices: RecentDevice[] = devicesData?.devices || []
  const loading = statsLoading || devicesLoading
  const error = statsError || devicesError

  const handleQuickControl = async (deviceId: string, command: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command })
      })

      if (res.ok) {
        toast.success(`ส่งคำสั่ง ${command} สำเร็จ`)
        // Revalidate devices list after command
        setTimeout(() => mutateDevices(), 1000)
      } else {
        const data = await res.json()
        toast.error(data.error || "ส่งคำสั่งล้มเหลว")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">ภาพรวมระบบ</h1>
            {stats.isAdmin && (
              <Badge variant="destructive" className="text-xs font-bold">
                🔐 ADMIN MODE
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground/60">
            {stats.isAdmin ? "กำลังดูอุปกรณ์ทั้งหมดในระบบ" : "สถานะอุปกรณ์และข้อมูลเรียลไทม์"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setSettingsOpen(true)}
            className="gap-2"
          >
            <SettingsIcon className="w-4 h-4" /> ตั้งค่า
          </Button>
          <Button variant="ghost" onClick={() => {
            mutateSummary()
            mutateDevices()
          }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> รีเฟรช
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded border border-destructive/40 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">อุปกรณ์ทั้งหมด</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.total}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ออนไลน์</p>
                <p className="text-3xl font-bold text-green-500 mt-2">
                  {loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.online}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ออฟไลน์</p>
                <p className="text-3xl font-bold text-red-500 mt-2">
                  {loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.offline}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Power className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ข้อความวันนี้</p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.messagesToday.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">ปริมาณข้อมูล 24 ชั่วโมงล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafficChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สัดส่วนสถานะอุปกรณ์</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart online={stats.online} offline={stats.offline} />
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Online History + Data Info + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">ประวัติออนไลน์ (7 วัน)</CardTitle>
          </CardHeader>
          <CardContent>
            <OnlineHistoryChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลจาก Supabase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">วันนี้: {new Date().toLocaleDateString('th-TH')}</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Loader className="h-6 w-6 animate-spin inline" /> : stats.messagesToday.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">ข้อมูลที่เก็บได้</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">ระหว่าง 5 นาทีล่าสุด</p>
              <p className="text-sm font-semibold text-foreground">
                {loading ? "-" : ((stats.messagesToday / ((Date.now() - new Date().setHours(0, 0, 0, 0)) / 1000)) || 0).toFixed(3)} msg/s
              </p>
            </div>
          </CardContent>
        </Card>
        
        <SystemHealthWidget className="lg:col-span-1" />
      </div>

      {/* Device Table + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Device Table - 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">อุปกรณ์อัปเดตล่าสุด (แสดง 5 ตัว)</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => mutateDevices()} className="gap-1">
                <RefreshCw className="w-4 h-4" /> รีเฟรช
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : recentDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีอุปกรณ์</p>
            ) : (
              <div className="space-y-3">
                {recentDevices.map((device: RecentDevice) => {
                  // Check if device is online: is_active AND updated within 5 minutes
                  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
                  const lastUpdate = device.last_update ? new Date(device.last_update) : null
                  const online = (device.is_active ?? false) && lastUpdate && lastUpdate > fiveMinutesAgo
                  const lastData = device.lastData
                  return (
                    <div
                      key={device.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground">{device.name}</p>
                          <Badge variant={online ? "default" : "secondary"} className="text-xs">
                            {online ? "ออนไลน์" : "ออฟไลน์"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{device.type}</span>
                          <span>•</span>
                          <span>{device.location || "ไม่ระบุ"}</span>
                        </div>
                        
                        {/* Latest Data - Ammonia Sensor */}
                        {lastData && (
                          <div className="mt-2 pt-2 border-t space-y-1">
                            {/* Primary: Ammonia PPM */}
                            {(lastData.ammonia_ppm !== null || lastData.value !== null) && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                  🧪 NH₃: {(lastData.ammonia_ppm || lastData.value)?.toFixed(2)} {lastData.unit || 'ppm'}
                                </span>
                                {(lastData.ammonia_ppm || lastData.value || 0) > 25 && (
                                  <Badge variant="destructive" className="text-xs">⚠️ สูง</Badge>
                                )}
                                {(lastData.ammonia_ppm || lastData.value || 0) > 50 && (
                                  <Badge variant="destructive" className="text-xs animate-pulse">🚨 อันตราย!</Badge>
                                )}
                              </div>
                            )}
                            {/* Secondary: Environmental */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              {lastData.temperature !== null && (
                                <span>🌡️ {lastData.temperature}°C</span>
                              )}
                              {lastData.humidity !== null && (
                                <span>💧 {lastData.humidity}%</span>
                              )}
                              {lastData.calibrated_ro !== null && (
                                <span title="Calibrated Resistance">⚙️ R₀: {lastData.calibrated_ro.toFixed(2)}</span>
                              )}
                              {lastData.station_id && (
                                <span>📍 {lastData.station_id}</span>
                              )}
                              {device.battery_level !== null && (
                                <span>🔋 {device.battery_level}%</span>
                              )}
                              {device.signal_strength !== null && (
                                <span>📶 {device.signal_strength}%</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          อัปเดต: {formatRelative(device.last_update || device.updated_at || device.created_at)}
                        </p>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCustomizingDevice(device)}
                          className="gap-1 text-muted-foreground hover:text-accent"
                          title="Customize Widget"
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickControl(device.id, "on")}
                          disabled={!online}
                          className="gap-1"
                        >
                          <Power className="h-3 w-3" /> เปิด
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickControl(device.id, "off")}
                          disabled={!online}
                          className="gap-1"
                        >
                          <Power className="h-3 w-3" /> ปิด
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs - 1/3 width */}
        <RecentLogsWidget className="lg:col-span-1" />
      </div>

      {/* Global Settings Dialog */}
      <GlobalSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Device Customization Dialog */}
      {customizingDevice && (
        <DeviceCustomizationDialog
          open={!!customizingDevice}
          onOpenChange={(open) => !open && setCustomizingDevice(null)}
          device={customizingDevice}
          onSave={() => {
            mutateDevices()
            toast.success("การปรับแต่งถูกบันทึกแล้ว")
          }}
        />
      )}
    </div>
  )
}
