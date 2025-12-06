import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { ui_config } = body

    if (!ui_config) {
      return NextResponse.json(
        { error: "ui_config is required" },
        { status: 400 }
      )
    }

    // Validate ui_config structure
    const validWidgetTypes = ["switch", "gauge", "slider", "stat"]
    if (!validWidgetTypes.includes(ui_config.widgetType)) {
      return NextResponse.json(
        { error: "Invalid widget type" },
        { status: 400 }
      )
    }

    // Verify device ownership
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, user_id")
      .eq("id", id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    if (device.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to customize this device" },
        { status: 403 }
      )
    }

    // Update ui_config in database
    const { data: updatedDevice, error: updateError } = await supabase
      .from("devices")
      .update({
        ui_config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update device ui_config:", updateError)
      return NextResponse.json(
        { error: "Failed to update customization" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      device: updatedDevice,
    })
  } catch (error) {
    console.error("Device customization error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
