import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: deviceId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบว่า device เป็นของ user จริงไหม
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*")
      .eq("id", deviceId)
      .eq("user_id", user.id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // ดึง device settings
    const { data: settings, error: settingsError } = await supabase
      .from("device_settings")
      .select("*")
      .eq("device_id", deviceId)
      .single()

    // ถ้าไม่มี settings ให้ return default
    if (settingsError?.code === "PGRST116") {
      return NextResponse.json({
        device_id: deviceId,
        min_threshold: null,
        max_threshold: null,
        alert_enabled: true,
        update_interval: 60,
      })
    }

    if (settingsError) {
      console.error("Error fetching settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
