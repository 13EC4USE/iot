import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get("deviceId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    let query = supabase
      .from("device_alerts")
      .select(
        `
        *,
        devices(user_id)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit)

    if (deviceId) {
      query = query.eq("device_id", deviceId)
    }

    const { data: alerts, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
    }

    // Filter to only user's devices
    const userAlerts = alerts.filter((alert: any) => alert.devices?.user_id === user.id)

    return NextResponse.json({
      success: true,
      count: userAlerts.length,
      alerts: userAlerts,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*")
      .eq("id", body.device_id)
      .eq("user_id", user.id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const { data: alert, error } = await supabase
      .from("device_alerts")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "สร้างการแจ้งเตือนสำเร็จ",
      alert,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
