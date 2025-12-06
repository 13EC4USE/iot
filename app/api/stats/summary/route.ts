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

    // Get device counts - optimized query
    let query = supabase
      .from("devices")
      .select("id, is_active, last_update", { count: "exact" })

    // Only filter by user_id if NOT admin
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data: devices, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = devices?.length || 0
    // Consider device online if is_active AND last_update within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const online = devices?.filter((d: any) => {
      const lastUpdate = d.last_update ? new Date(d.last_update) : null
      return d.is_active && lastUpdate && lastUpdate > fiveMinutesAgo
    }).length || 0
    const offline = total - online

    // Get today's message count
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: messagesToday, error: msgError } = await supabase
      .from("sensor_data")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", todayStart.toISOString())

    if (msgError) {
      console.error("Message count error:", msgError)
    }

    return NextResponse.json({
      total,
      online,
      offline,
      messagesToday: messagesToday || 0,
      isAdmin,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Stats summary error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
