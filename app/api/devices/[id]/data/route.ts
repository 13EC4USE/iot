import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// convert "24h" → milliseconds
function parseRange(range: string | null): number {
  if (!range) return 24 * 60 * 60 * 1000
  const m = range.match(/^(\d+)(h|m|d)$/)
  if (!m) return 24 * 60 * 60 * 1000

  const v = parseInt(m[1], 10)
  const unit = m[2]

  switch (unit) {
    case "m": return v * 60 * 1000         // minutes
    case "h": return v * 60 * 60 * 1000    // hours
    case "d": return v * 24 * 60 * 60 * 1000 // days
  }

  return 24 * 60 * 60 * 1000
}

//
// -------------------------
//   GET sensor data
// -------------------------
//
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const search = request.nextUrl.searchParams
    const range = search.get("range") || "24h"
    const limit = Number(search.get("limit") || "500")

    const windowMs = parseRange(range)
    const since = new Date(Date.now() - windowMs).toISOString()

    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .eq("device_id", params.id)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch data", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      device_id: params.id,
      count: data.length,
      range,
      data,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

//
// -------------------------
//   POST sensor data
// -------------------------
//
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()

    const payload = {
      device_id: params.id,
      value: body.value ?? null,
      unit: body.unit ?? null,
      temperature: body.temperature ?? null,
      humidity: body.humidity ?? null,
      battery_level: body.battery_level ?? null,
      timestamp: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("sensor_data")
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
      data,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
