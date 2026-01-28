import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/utils/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isAdmin = isSuperAdmin(user.email)

    // Use admin client to bypass RLS for stats queries
    const queryClient = isAdmin ? createAdminClient() : supabase

    // Scope devices for non-admin users
    let deviceIds: string[] = []
    if (!isAdmin) {
      const { data: devices, error: deviceErr } = await queryClient
        .from("devices")
        .select("id")
        .eq("user_id", user.id)

      if (deviceErr) {
        console.error("message-rate devices error", deviceErr)
        return NextResponse.json({ error: deviceErr.message }, { status: 500 })
      }

      deviceIds = devices?.map((d: any) => d.id) || []
      if (deviceIds.length === 0) {
        return NextResponse.json({
          mqttMessagesPerSecond: 0,
          supabaseMessagesPerSecond: 0,
          messagesToday: 0,
          supabaseMessagesToday: 0,
          lastMessageAt: null,
          scope: "user",
        })
      }
    }

    const now = new Date()
    const windowStart = new Date(now.getTime() - 5 * 60 * 1000) // last 5 minutes
    
    // ใช้ UTC date สำหรับ today
    const todayStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ))

    const baseCountSelect = { count: "exact" as const, head: true }

    let windowQuery = queryClient
      .from("sensor_data")
      .select("*", baseCountSelect)
      .gte("timestamp", windowStart.toISOString())

    let todayQuery = queryClient
      .from("sensor_data")
      .select("*", baseCountSelect)
      .gte("timestamp", todayStart.toISOString())

    let latestQuery = queryClient
      .from("sensor_data")
      .select("timestamp")
      .order("timestamp", { ascending: false })
      .limit(1)

    if (!isAdmin) {
      windowQuery = windowQuery.in("device_id", deviceIds)
      todayQuery = todayQuery.in("device_id", deviceIds)
      latestQuery = latestQuery.in("device_id", deviceIds)
    }

    const [windowRes, todayRes, latestRes] = await Promise.all([
      windowQuery,
      todayQuery,
      latestQuery,
    ])

    if (windowRes.error) {
      console.error("message-rate window error", windowRes.error)
      return NextResponse.json({ error: windowRes.error.message }, { status: 500 })
    }
    if (todayRes.error) {
      console.error("message-rate today error", todayRes.error)
      return NextResponse.json({ error: todayRes.error.message }, { status: 500 })
    }
    if (latestRes.error) {
      console.error("message-rate latest error", latestRes.error)
      return NextResponse.json({ error: latestRes.error.message }, { status: 500 })
    }

    const windowCount = windowRes.count || 0
    const todayCount = todayRes.count || 0
    const lastMessageAt = latestRes.data?.[0]?.timestamp || null

    const seconds = 5 * 60
    const supabaseMessagesPerSecond = seconds > 0 ? Number((windowCount / seconds).toFixed(3)) : 0
    const mqttMessagesPerSecond = supabaseMessagesPerSecond

    return NextResponse.json({
      mqttMessagesPerSecond,
      supabaseMessagesPerSecond,
      messagesToday: todayCount,
      supabaseMessagesToday: todayCount,
      lastMessageAt,
      scope: isAdmin ? "admin" : "user",
      windowMinutes: 5,
    })
  } catch (error: any) {
    console.error("message-rate error", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
