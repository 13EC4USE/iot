import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Count messages in last minute to calculate msg/s
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from("sensor_data")
      .select("*", { count: 'exact', head: true })
      .gte("timestamp", oneMinuteAgo)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate messages per second
    const messagesPerSecond = ((count || 0) / 60).toFixed(2)

    // Get total messages today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { count: todayCount, error: todayError } = await supabase
      .from("sensor_data")
      .select("*", { count: 'exact', head: true })
      .gte("timestamp", todayStart.toISOString())

    if (todayError) {
      return NextResponse.json({ error: todayError.message }, { status: 500 })
    }

    return NextResponse.json({
      messagesPerSecond: parseFloat(messagesPerSecond),
      messagesToday: todayCount || 0,
      lastMinuteCount: count || 0
    })
  } catch (error: any) {
    console.error("Message rate error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
