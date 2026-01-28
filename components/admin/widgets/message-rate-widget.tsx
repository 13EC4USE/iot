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
  // Use SWR for message rate - refresh every 30 seconds for real-time display
  const { data, isLoading, error } = useSWR(
    "/api/stats/message-rate",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      refreshInterval: 30000, // 30 seconds for real-time updates
      errorRetryCount: 2,
      errorRetryInterval: 30000,
    }
  )

  const rate = data?.mqttMessagesPerSecond ?? data?.messagesPerSecond ?? 0
  const todayCount = data?.messagesToday ?? 0
  const supaRate = data?.supabaseMessagesPerSecond ?? rate
  const supaToday = data?.supabaseMessagesToday ?? todayCount
  const lastMessageAt = data?.lastMessageAt ? new Date(data.lastMessageAt) : null

  if (isLoading && !data) {
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

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">อัตราข้อความ (MQTT)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-sm">เกิดข้อผิดพลาด</div>
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
        <GaugeChart value={rate} max={10} label="MQTT msg/s" />
        <div className="text-center mt-3 space-y-1 text-sm text-muted-foreground">
          <p>
            MQTT วันนี้: <span className="font-semibold text-foreground">{todayCount.toLocaleString()}</span> ข้อความ
          </p>
          <p>
            Supabase: <span className="font-semibold text-foreground">{supaRate.toFixed(3)}</span> msg/s • วันนี้ <span className="font-semibold text-foreground">{supaToday.toLocaleString()}</span>
          </p>
          <p>
            บันทึกล่าสุด: <span className="font-semibold text-foreground">{lastMessageAt ? lastMessageAt.toLocaleString("th-TH", { hour12: false }) : "ไม่มีบันทึก"}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
