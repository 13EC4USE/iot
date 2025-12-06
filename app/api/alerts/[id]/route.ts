import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: alertId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { is_read } = body

    // Verify ownership via device
    const { data: alert } = await supabase
      .from("device_alerts")
      .select("device_id")
      .eq("id", alertId)
      .single()

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    // Verify device ownership
    const { data: device } = await supabase
      .from("devices")
      .select("id")
      .eq("id", alert.device_id)
      .eq("user_id", user.id)
      .single()

    if (!device) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update alert
    const { error } = await supabase
      .from("device_alerts")
      .update({
        is_read,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Alert update error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: alertId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership via device
    const { data: alert } = await supabase
      .from("device_alerts")
      .select("device_id")
      .eq("id", alertId)
      .single()

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    // Verify device ownership
    const { data: device } = await supabase
      .from("devices")
      .select("id")
      .eq("id", alert.device_id)
      .eq("user_id", user.id)
      .single()

    if (!device) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete alert
    const { error } = await supabase
      .from("device_alerts")
      .delete()
      .eq("id", alertId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Alert delete error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
