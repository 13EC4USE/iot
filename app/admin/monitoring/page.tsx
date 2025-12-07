"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Pause, Play } from "lucide-react"
import { useState } from "react"
import { SystemStatusWidget } from "@/components/admin/widgets/system-status-widget"
import { ServerMonitoringWidget } from "@/components/admin/widgets/server-monitoring-widget"
import { SystemHealthWidget } from "@/components/admin/widgets/system-health-widget"
import { MessageRateWidget } from "@/components/admin/widgets/message-rate-widget"
import { RecentLogsWidget } from "@/components/admin/widgets/recent-logs-widget"

export default function MonitoringPage() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false)

  const handleRefresh = async () => {
    setIsManualRefreshing(true)
    setLastRefresh(new Date())
    setTimeout(() => setIsManualRefreshing(false), 1000)
  }

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">การติดตามระบบและ Server</h1>
          <p className="text-sm text-foreground/60 mt-1">
            ตรวจสอบสถานะระบบ Server และอุปกรณ์แบบเรียลไทม์
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant={isAutoRefreshEnabled ? "default" : "outline"}
            onClick={toggleAutoRefresh}
            className="gap-2"
            title={isAutoRefreshEnabled ? "ปิดการอัปเดตอัตโนมัติ" : "เปิดการอัปเดตอัตโนมัติ"}
          >
            {isAutoRefreshEnabled ? (
              <>
                <Pause className="w-4 h-4" />
                หยุดอัปเดต
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                เปิดอัปเดต
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isManualRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isManualRefreshing ? "animate-spin" : ""}`} />
            {isManualRefreshing ? "กำลังอัปเดต..." : "รีเฟรช"}
          </Button>
        </div>
      </div>

      {isAutoRefreshEnabled && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
          <Play className="w-4 h-4" />
          <span className="text-sm">
            การอัปเดตอัตโนมัติเปิดอยู่ - ข้อมูลจะอัปเดตทุก 5 นาที
          </span>
        </div>
      )}

      {/* Main Status Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStatusWidget autoRefreshEnabled={isAutoRefreshEnabled} />
        <ServerMonitoringWidget autoRefreshEnabled={isAutoRefreshEnabled} />
      </div>

      {/* Health & Performance Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SystemHealthWidget className="lg:col-span-1" autoRefreshEnabled={isAutoRefreshEnabled} />
        <MessageRateWidget className="lg:col-span-1" autoRefreshEnabled={isAutoRefreshEnabled} />
        <RecentLogsWidget className="lg:col-span-1" autoRefreshEnabled={isAutoRefreshEnabled} />
      </div>

      {/* Detailed System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ข้อมูลระบบโดยละเอียด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Browser</p>
              <p className="text-sm font-semibold text-foreground">
                {typeof window !== "undefined" ? navigator.userAgent.split(" ").slice(-2).join(" ") : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Time</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date().toLocaleString("th-TH")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Last Refresh</p>
              <p className="text-sm font-semibold text-foreground">
                {lastRefresh.toLocaleTimeString("th-TH")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-semibold text-green-500">🟢 ออนไลน์</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
