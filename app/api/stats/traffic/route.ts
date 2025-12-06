import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get data for last 24 hours grouped by hour
    const { data: trafficData, error } = await supabase
      .from("sensor_data")
      .select("timestamp")
      .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by hour
    const hourlyData = new Array(24).fill(0)
    const now = new Date()
    
    trafficData?.forEach((record) => {
      const timestamp = new Date(record.timestamp)
      const hoursDiff = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60))
      if (hoursDiff >= 0 && hoursDiff < 24) {
        hourlyData[23 - hoursDiff]++
      }
    })

    // Generate labels (last 24 hours)
    const labels = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
      return `${hour.getHours().toString().padStart(2, '0')}:00`
    })

    return NextResponse.json({
      labels,
      data: hourlyData,
      total: trafficData?.length || 0
    })
  } catch (error: any) {
    console.error("Traffic stats error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
