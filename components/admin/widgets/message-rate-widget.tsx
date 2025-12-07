"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GaugeChart } from "../charts/gauge-chart"
import { Activity } from "lucide-react"

interface MessageRateWidgetProps {
  className?: string
  autoRefreshEnabled?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json())

export function MessageRateWidget({ className, autoRefreshEnabled = false }: MessageRateWidgetProps) {
  // Use SWR for message rate - optimized for less frequent requests
  const { data, isLoading } = useSWR(
    "/api/stats/message-rate",
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

  const rate = data?.messagesPerSecond || 0
  const todayCount = data?.messagesToday || 0

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">อัตราข้อความ (MQTT)</CardTitle>
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
          อัตราข้อความ (MQTT)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GaugeChart value={rate} max={10} label="msg/s" />
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">
            วันนี้: <span className="font-semibold text-foreground">{todayCount.toLocaleString()}</span> ข้อความ
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
