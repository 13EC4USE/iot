import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

/**
 * Ingest route for MQTT messages.
 * Security: accepts requests either signed with an HMAC (header `x-ingest-signature`)
 * using `process.env.MQTT_INGEST_SECRET`, or from an authenticated Supabase user (session cookie).
 */
export async function POST(request: Request) {
  try {
    const raw = await request.text()

    // HMAC verification
    const signature = request.headers.get("x-ingest-signature")
    const secret = process.env.MQTT_INGEST_SECRET

    let verified = false

    if (signature && secret) {
      try {
        const hmac = crypto.createHmac("sha256", secret)
        hmac.update(raw)
        const expected = `sha256=${hmac.digest("hex")}`
        if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
          verified = true
        }
      } catch (e) {
        console.warn("HMAC verification failed:", e)
      }
    }

    // Require HMAC signature only — no session fallback allowed here.
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = JSON.parse(raw || "{}")
    const { topic, payload } = body

    if (!topic || !payload) {
      return NextResponse.json({ error: "Missing topic or payload" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Try to find device by mqtt_topic matching the topic
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
      console.error("Failed to insert sensor_data:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("/api/mqtt/ingest error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
