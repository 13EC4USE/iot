"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Info, XCircle, Clock } from "lucide-react"

interface RecentLogsProps {
  className?: string
  autoRefreshEnabled?: boolean
}

interface LogEntry {
  id: string
  type: string
  severity: string
  message: string
  deviceName: string
  timestamp: string
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export function RecentLogsWidget({ className, autoRefreshEnabled = false }: RecentLogsProps) {
  // Use SWR for recent logs - optimized for less frequent requests
  const { data: logsData, isLoading: loading } = useSWR(
    "/api/stats/recent-logs",
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

  const logs = logsData?.logs || []

  const getIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">บันทึกล่าสุด</CardTitle>
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
          <Clock className="h-5 w-5" />
          บันทึกล่าสุด
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              ไม่มีบันทึก
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: LogEntry) => (
                <div
                  key={log.id}
                  className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="mt-0.5">{getIcon(log.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">{log.deviceName}</span>
                      <Badge variant={getSeverityColor(log.severity) as any} className="text-xs">
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {log.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(log.timestamp).toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
