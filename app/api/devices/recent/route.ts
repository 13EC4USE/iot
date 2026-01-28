import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdmin } from "@/lib/utils/admin"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isAdmin = isSuperAdmin(user.email)

    // Get URL params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "5")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    // Get recent devices with pagination (server-side)
    let query = supabase
      .from("devices")
      .select(
        `
        id,
        name,
        type,
        location,
        is_active,
        last_update,
        updated_at,
        created_at,
        battery_level,
        signal_strength,
        user_id
      `,
        { count: "exact" }
      )

    // Only filter by user_id if NOT admin
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data: devices, error, count } = await query
      .order("last_update", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get latest data point for each device separately
    const enriched = await Promise.all(
      (devices || []).map(async (device: any) => {
        const { data: latestData } = await supabase
          .from("sensor_data")
          .select("value, unit, temperature, humidity, ammonia_ppm, calibrated_ro, station_id, timestamp")
          .eq("device_id", device.id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .single()

        return {
          ...device,
          lastData: latestData || null
        }
      })
    )

    return NextResponse.json({
      devices: enriched,
      total: count,
      limit,
      offset,
      hasMore: offset + limit < (count || 0)
    })
  } catch (error: any) {
    console.error("Recent devices error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
