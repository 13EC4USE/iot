import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

/**
 * Server-side proxy for browser clients. Verifies the user session via
 * Supabase server client (cookies) and then performs the same ingest logic
 * using the Admin client. This avoids exposing `MQTT_INGEST_SECRET` to the browser
 * and lets the client use a simple POST to `/api/mqtt/ingest/proxy`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { topic, payload } = body

    if (!topic || !payload) {
      return NextResponse.json({ error: "Missing topic or payload" }, { status: 400 })
    }

    // Verify session via server client (reads cookies)
    try {
      const serverSupabase = await createServerClient()
      const { data: { user }, error: userError } = await serverSupabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } catch (e) {
      console.error('[mqtt-ingest-proxy] session verification error', e)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Find device by mqtt_topic
    const { data: device, error: deviceError } = await supabase.from("devices").select("id,type").eq("mqtt_topic", topic).limit(1).single()
    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found for topic" }, { status: 404 })
    }

    // payload may be string or object
    const parsed = typeof payload === "string" ? (() => {
      try { return JSON.parse(payload) } catch { return { value: payload } }
    })() : payload

    const value = parsed.value ?? parsed.val ?? null
    const temperature = parsed.temperature ?? parsed.temp ?? null
    const humidity = parsed.humidity ?? null
    const unit = parsed.unit ?? (device.type === "temperature" ? "°C" : device.type === "humidity" ? "%" : "units")
    const timestamp = parsed.timestamp ?? new Date().toISOString()

    const { error: insertError } = await supabase.from("sensor_data").insert({
      device_id: device.id,
      value: value ?? 0,
      unit,
      temperature,
      humidity,
      timestamp,
    })

    if (insertError) {
      console.error('[mqtt-ingest-proxy] Failed to insert sensor_data:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('/api/mqtt/ingest/proxy error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
