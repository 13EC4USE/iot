import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get recent alerts (last 10)
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select(`
        id,
        type,
        severity,
        message,
        created_at,
        device:devices!inner(name)
      `)
      .eq("devices.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the data
    const formattedLogs = alerts?.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      deviceName: (alert.device as any)?.name || 'Unknown',
      timestamp: alert.created_at
    })) || []

    return NextResponse.json({ logs: formattedLogs })
  } catch (error: any) {
    console.error("Recent logs error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
