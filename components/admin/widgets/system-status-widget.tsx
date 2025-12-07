"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, Database, HardDrive, Zap, Loader } from "lucide-react"

interface SystemStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  totalDataPoints: number
  totalAlerts: number
  activeSessions: number
}

interface SystemStatusWidgetProps {
  className?: string
  autoRefreshEnabled?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SystemStatusWidget({ className = "", autoRefreshEnabled = false }: SystemStatusWidgetProps) {
  const [systemStatus, setSystemStatus] = useState<"healthy" | "warning" | "critical">("healthy")
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useEffect(() => {
    const detectTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    detectTheme()

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      detectTheme()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return () => observer.disconnect()
  }, [])

  const { data, isLoading } = useSWR(
    "/api/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000, // 2 minutes - prevent duplicate requests
      refreshInterval: autoRefreshEnabled ? 300000 : undefined, // 5 minutes if enabled, undefined = disabled
      errorRetryCount: 2,
      errorRetryInterval: 30000,
    }
  )

  const stats: SystemStats = data?.stats || {
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalDataPoints: 0,
    totalAlerts: 0,
    activeSessions: 0,
  }

  // Determine system status based on metrics
  useEffect(() => {
    if (!data) return

    const onlineRatio = stats.totalDevices > 0 ? stats.onlineDevices / stats.totalDevices : 0
    const hasAlerts = stats.totalAlerts > 10

    if (onlineRatio >= 0.9 && !hasAlerts) {
      setSystemStatus("healthy")
    } else if (onlineRatio >= 0.7 || (hasAlerts && stats.totalAlerts <= 50)) {
      setSystemStatus("warning")
    } else {
      setSystemStatus("critical")
    }
  }, [data, stats])

  const getStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "warning":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "critical":
        return "bg-red-500/10 text-red-600 dark:text-red-400"
    }
  }

  const getStatusIcon = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5" />
      case "warning":
        return <AlertCircle className="w-5 h-5" />
      case "critical":
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getStatusLabel = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return "ระบบสมบูรณ์"
      case "warning":
        return "ระบบเตือน"
      case "critical":
        return "ระบบวิกฤติ"
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">สถานะระบบ</CardTitle>
          <Badge className={`${getStatusColor(systemStatus)} border-0`}>
            {getStatusIcon(systemStatus)}
            <span className="ml-1">{getStatusLabel(systemStatus)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            {/* Online Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  อุปกรณ์ออนไลน์
                </span>
                <span className="font-semibold text-foreground">
                  {stats.onlineDevices} / {stats.totalDevices}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                  style={{
                    width: `${stats.totalDevices > 0 ? (stats.onlineDevices / stats.totalDevices) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Alert Status */}
            <div className="flex items-center justify-between text-sm p-3 rounded-lg" 
              style={{
                backgroundColor: isDark ? "#3a3a3a" : "#f5f5f5"
              }}
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                การแจ้งเตือนเชิงรุก
              </span>
              <Badge variant="outline" className="font-semibold">
                {stats.totalAlerts}
              </Badge>
            </div>

            {/* Active Sessions */}
            <div className="flex items-center justify-between text-sm p-3 rounded-lg"
              style={{
                backgroundColor: isDark ? "#3a3a3a" : "#f5f5f5"
              }}
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                วิทยากร/ผู้ใช้ที่ใช้งาน
              </span>
              <Badge variant="outline" className="font-semibold">
                {stats.activeSessions}
              </Badge>
            </div>

            {/* Data Points */}
            <div className="flex items-center justify-between text-sm p-3 rounded-lg"
              style={{
                backgroundColor: isDark ? "#3a3a3a" : "#f5f5f5"
              }}
            >
              <span className="text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                จุดข้อมูลทั้งหมด
              </span>
              <span className="font-semibold text-foreground">
                {(stats.totalDataPoints || 0).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
