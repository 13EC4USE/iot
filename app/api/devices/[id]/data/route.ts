import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function parseRange(range: string | null) {
  if (!range) return 24
  const m = range.match(/^(\d+)(h|m)$/)
  if (!m) return 24
  const v = parseInt(m[1], 10)
  const unit = m[2]
  if (unit === "h") return v
  if (unit === "m") return Math.max(1, Math.floor(v / 60))
  return 24
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const url = new URL(req.url)
    const range = url.searchParams.get("range") || "24h"
    const hours = parseRange(range)
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .eq("device_id", id)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { value, unit, temperature, humidity, timestamp } = body

    const supabase = await createClient()

    const payload: any = {
      device_id: id,
      value: value ?? null,
      unit: unit ?? null,
      temperature: temperature ?? null,
      humidity: humidity ?? null,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    }

    const { data, error } = await supabase.from("sensor_data").insert(payload).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const range = searchParams.get("range") || "24h"
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .eq("device_id", params.id)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    }

    return NextResponse.json({
      deviceId: params.id,
      range,
      count: data.length,
      data: data,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const body = await request.json()

    const { data: sensorData, error } = await supabase
      .from("sensor_data")
      .insert({
        device_id: params.id,
        ...body,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
      data: sensorData,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
