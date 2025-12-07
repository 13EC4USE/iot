"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Cpu, Database as DatabaseIcon, HardDrive, Network, Activity, Loader, TrendingUp } from "lucide-react"

interface ServerStats {
  systemUptime: string
  averageResponseTime: string
  dataStorageUsed: string
  dataStorageLimit: string
}

interface ServerMonitoringWidgetProps {
  className?: string
  autoRefreshEnabled?: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ServerMonitoringWidget({ className = "", autoRefreshEnabled = false }: ServerMonitoringWidgetProps) {
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

  const stats: ServerStats = data?.stats || {
    systemUptime: "N/A",
    averageResponseTime: "N/A",
    dataStorageUsed: "N/A",
    dataStorageLimit: "N/A",
  }

  // Parse storage percentage
  const parseStoragePercentage = () => {
    try {
      const used = parseFloat(stats.dataStorageUsed)
      const limit = parseFloat(stats.dataStorageLimit)
      if (!isNaN(used) && !isNaN(limit) && limit > 0) {
        return Math.round((used / limit) * 100)
      }
    } catch {}
    return 0
  }

  const storagePercentage = parseStoragePercentage()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">การตรวจสอบ Server</CardTitle>
          <Badge variant="outline" className="gap-1">
            <Activity className="w-3 h-3 text-green-500" />
            ทำงาน
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
            {/* Server Uptime */}
            <div className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: isDark ? "#3a3a3a" : "#f5f5f5"
              }}
            >
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                ระยะเวลาการทำงาน
              </span>
              <span className="text-sm font-semibold text-foreground">
                {stats.systemUptime}
              </span>
            </div>

            {/* Response Time */}
            <div className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: isDark ? "#3a3a3a" : "#f5f5f5"
              }}
            >
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                เวลาตอบสนองเฉลี่ย
              </span>
              <span className="text-sm font-semibold text-foreground">
                {stats.averageResponseTime}
              </span>
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  การใช้พื้นที่เก็บข้อมูล
                </span>
                <span className={`font-semibold ${storagePercentage > 80 ? "text-red-500" : "text-foreground"}`}>
                  {storagePercentage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      storagePercentage > 80
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : "bg-gradient-to-r from-purple-500 to-purple-600"
                    }`}
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {stats.dataStorageUsed}/{stats.dataStorageLimit}
                </span>
              </div>
            </div>

            {/* Storage Status Badge */}
            <div className="flex gap-2 pt-2">
              {storagePercentage > 80 ? (
                <Badge variant="destructive" className="w-full justify-center">
                  ⚠️ พื้นที่เก็บข้อมูลจำกัด
                </Badge>
              ) : (
                <Badge variant="default" className="w-full justify-center bg-green-600 hover:bg-green-700">
                  ✅ พื้นที่เก็บข้อมูลดี
                </Badge>
              )}
            </div>

            {/* System Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0"
                }}
              >
                <Cpu className="w-3 h-3 text-cyan-500" />
                <span className="text-muted-foreground">CPU Load</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0"
                }}
              >
                <DatabaseIcon className="w-3 h-3 text-yellow-500" />
                <span className="text-muted-foreground">Database</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0"
                }}
              >
                <Network className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">Network</span>
              </div>
              <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                style={{
                  backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0"
                }}
              >
                <Activity className="w-3 h-3 text-pink-500" />
                <span className="text-muted-foreground">Memory</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
