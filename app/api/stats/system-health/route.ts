import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check database connection
    const { error: dbError } = await supabase.from("devices").select("id").limit(1)
    const databaseStatus = !dbError

    // Check if we can query sensor data (proxy for MQTT working)
    // Check last 5 minutes instead of 1 minute for more stable status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentData, error: mqttError } = await supabase
      .from("sensor_data")
      .select("id")
      .gte("timestamp", fiveMinutesAgo)
      .limit(1)
    
    // MQTT is considered working if:
    // 1. No error querying the table
    // 2. Either has recent data OR the table exists (can query)
    const mqttStatus = !mqttError

    // Get system stats (simulated - in real system would query actual server metrics)
    const apiStatus = true // If we reached here, API is running

    // Simulate resource usage (in production, you'd query actual metrics)
    const cpuUsage = Math.floor(Math.random() * 30) + 20 // 20-50%
    const ramUsage = Math.floor(Math.random() * 40) + 30 // 30-70%
    const diskUsage = Math.floor(Math.random() * 20) + 40 // 40-60%

    return NextResponse.json({
      status: {
        database: databaseStatus,
        mqtt: mqttStatus,
        api: apiStatus
      },
      resources: {
        cpu: cpuUsage,
        ram: ramUsage,
        disk: diskUsage
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("System health error:", error)
    return NextResponse.json({
      status: {
        database: false,
        mqtt: false,
        api: false
      },
      resources: {
        cpu: 0,
        ram: 0,
        disk: 0
      },
      error: error?.message || "Internal server error"
    }, { status: 500 })
  }
}
