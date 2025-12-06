"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GaugeChart } from "../charts/gauge-chart"
import { Activity } from "lucide-react"

interface MessageRateWidgetProps {
  className?: string
}

export function MessageRateWidget({ className }: MessageRateWidgetProps) {
  const [rate, setRate] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRate()
    const interval = setInterval(fetchRate, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRate = async () => {
    try {
      const res = await fetch("/api/stats/message-rate")
      const data = await res.json()
      setRate(data.messagesPerSecond || 0)
      setTodayCount(data.messagesToday || 0)
    } catch (error) {
      console.error("Failed to fetch message rate:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
