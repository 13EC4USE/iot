"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Radio, Server } from "lucide-react"

interface SystemHealthProps {
  className?: string
  autoRefreshEnabled?: boolean
}

interface HealthData {
  status: {
    database: boolean
    mqtt: boolean
    api: boolean
  }
  resources: {
    cpu: number
    ram: number
    disk: number
  }
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export function SystemHealthWidget({ className, autoRefreshEnabled = false }: SystemHealthProps) {
  // Use SWR for system health - reduced from 30s to 60s refresh
  const { data: health, isLoading: loading } = useSWR(
    "/api/stats/system-health",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 120000, // 2 minutes
      refreshInterval: autoRefreshEnabled ? 300000 : undefined, // 5 minutes if enabled, undefined = disabled
      errorRetryCount: 2,
      errorRetryInterval: 30000,
    }
  )

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">สุขภาพระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          สุขภาพระบบ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">สถานะบริการ</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Database</span>
              </div>
              <Badge variant={health?.status.database ? "default" : "destructive"} className="text-xs">
                {health?.status.database ? "เชื่อมต่อ" : "ขาดการเชื่อมต่อ"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">MQTT Broker</span>
              </div>
              <Badge variant={health?.status.mqtt ? "default" : "destructive"} className="text-xs">
                {health?.status.mqtt ? "ทำงาน" : "หยุดทำงาน"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Backend API</span>
              </div>
              <Badge variant={health?.status.api ? "default" : "destructive"} className="text-xs">
                {health?.status.api ? "ทำงาน" : "หยุดทำงาน"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">การใช้ทรัพยากร</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">CPU</span>
                <span className="text-xs font-medium">{health?.resources.cpu}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${health?.resources.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">RAM</span>
                <span className="text-xs font-medium">{health?.resources.ram}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${health?.resources.ram}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Disk</span>
                <span className="text-xs font-medium">{health?.resources.disk}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${health?.resources.disk}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
