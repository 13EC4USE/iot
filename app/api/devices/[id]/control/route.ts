import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { action, value } = body

    const supabase = await createServerSupabase()

    if (action === 'power') {
      const { data, error } = await supabase.from('devices').update({ power: !!value }).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json(data)
    }

    // extend with other actions as needed
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
import { createClient } from "@/lib/supabase/server"
import { publishMessage } from "@/lib/mqtt/client"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, value } = await request.json()

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    if (action === "power") {
      const topic = `${device.mqtt_topic}/control/power`
      publishMessage(topic, JSON.stringify({ power: value }))

      // Update device power state in database
      await supabase.from("devices").update({ power: value, updated_at: new Date().toISOString() }).eq("id", params.id)

      return NextResponse.json({
        success: true,
        message: value ? "เปิดอุปกรณ์สำเร็จ" : "ปิดอุปกรณ์สำเร็จ",
        deviceId: params.id,
        power: value,
      })
    }

    if (action === "setThreshold") {
      const topic = `${device.mqtt_topic}/control/threshold`
      publishMessage(topic, JSON.stringify(value))

      // Update device settings
      await supabase.from("device_settings").upsert({
        device_id: params.id,
        min_threshold: value.min,
        max_threshold: value.max,
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "ตั้งค่า Threshold สำเร็จ",
        deviceId: params.id,
        threshold: value,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
