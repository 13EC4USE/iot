import { createClient } from "@/lib/supabase/server"
import { NextResponse, NextRequest } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { reporting_interval } = body

    // Validate interval
    if (!reporting_interval || reporting_interval < 5 || reporting_interval > 120) {
      return NextResponse.json(
        { error: "Interval must be between 5 and 120 minutes" },
        { status: 400 }
      )
    }

    // Save to user profile settings (if you have a settings table)
    // For now, just return success - the client will handle localStorage
    // In production, you'd save this to a settings table

    return NextResponse.json({
      success: true,
      reporting_interval,
      message: "Settings updated successfully"
    })
  } catch (error: any) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Return default settings
    // In production, fetch from settings table
    return NextResponse.json({
      reporting_interval: 30, // default 30 minutes
      timezone: "UTC",
      autoRefresh: true
    })
  } catch (error: any) {
    console.error("Get settings error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
