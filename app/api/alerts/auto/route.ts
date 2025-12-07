import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// API สำหรับสร้างการแจ้งเตือนอัตโนมัติจาก MQTT/System
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { device_id, type, severity, message, threshold_value, actual_value } = body

    // Validate device exists
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, user_id, name, type")
      .eq("id", device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      )
    }

    // Create alert
    const { data: alert, error: alertError } = await supabase
      .from("device_alerts")
      .insert({
        device_id: device.id,
        type,
        severity: severity || "warning",
        message: message || `${type} detected on ${device.name}`,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (alertError) {
      console.error("Failed to create alert:", alertError)
      return NextResponse.json(
        { error: "Failed to create alert", details: alertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alert,
    })
  } catch (error: any) {
    console.error("Auto-alert creation error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
