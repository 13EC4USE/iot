import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get all devices for the user
    const { data: devices, error } = await supabase
      .from("devices")
      .select("id, last_update, is_active")
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const now = new Date()
    const dailyData: number[] = []
    const labels: string[] = []

    // Generate data for last 7 days
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() - i)
      targetDate.setHours(23, 59, 59, 999) // End of day

      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)

      // Count devices that were online on this day
      // (last_update within this day OR after this day)
      const onlineCount = devices?.filter((device) => {
        if (!device.last_update || !device.is_active) return false
        const lastUpdate = new Date(device.last_update)
        // Device is online if it updated on or after the start of this day
        return lastUpdate >= startOfDay
      }).length || 0

      dailyData.push(onlineCount)
      labels.push(targetDate.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }))
    }

    return NextResponse.json({
      labels,
      data: dailyData
    })
  } catch (error: any) {
    console.error("Online history error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
