import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/utils/admin"

const DEFAULT_WARN = 25
const DEFAULT_CRIT = 50

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("alert_thresholds")
      .select("warn_threshold, crit_threshold")
      .is("device_id", null)
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      warn_threshold: data?.warn_threshold ?? DEFAULT_WARN,
      crit_threshold: data?.crit_threshold ?? DEFAULT_CRIT,
    })
  } catch (err: any) {
    console.error("[alerts/settings] GET error", err)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Optional: restrict to admin only
    if (!isSuperAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const warn = Number(body.warn_threshold)
    const crit = Number(body.crit_threshold)

    if (!Number.isFinite(warn) || !Number.isFinite(crit)) {
      return NextResponse.json({ error: "Invalid thresholds" }, { status: 400 })
    }
    if (warn < 0 || crit < 0) {
      return NextResponse.json({ error: "Threshold must be >= 0" }, { status: 400 })
    }
    if (crit <= warn) {
      return NextResponse.json({ error: "Critical ต้องมากกว่า Warning" }, { status: 400 })
    }

    const { error } = await supabase
      .from("alert_thresholds")
      .upsert({
        device_id: null,
        warn_threshold: warn,
        crit_threshold: crit,
        updated_at: new Date().toISOString(),
      }, { onConflict: "device_id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[alerts/settings] POST error", err)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
