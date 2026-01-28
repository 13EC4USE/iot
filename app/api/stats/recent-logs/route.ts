import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdmin } from "@/lib/utils/admin"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isAdmin = isSuperAdmin(user.email)

    // Fetch devices the user can see
    let devicesQuery = supabase
      .from("devices")
      .select("id, name, user_id")

    if (!isAdmin) {
      devicesQuery = devicesQuery.eq("user_id", user.id)
    }

    const { data: devices, error: devicesError } = await devicesQuery
    if (devicesError) {
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json({ logs: [] })
    }

    const deviceIds = devices.map((d: any) => d.id)
    const deviceNameMap = new Map<string, string>()
    devices.forEach((d: any) => deviceNameMap.set(d.id, d.name))

    // Get recent alerts from device_alerts (last 10)
    const { data: alerts, error: alertsError } = await supabase
      .from("device_alerts")
      .select("id, type, severity, message, device_id, created_at")
      .in("device_id", deviceIds)
      .order("created_at", { ascending: false })
      .limit(10)

    if (alertsError) {
      return NextResponse.json({ error: alertsError.message }, { status: 500 })
    }

    const formattedLogs = (alerts || []).map((a: any) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      deviceName: deviceNameMap.get(a.device_id) || "Unknown",
      timestamp: a.created_at,
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error: any) {
    console.error("Recent logs error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
