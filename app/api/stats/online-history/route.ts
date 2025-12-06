import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get device online status for last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const { data: devices, error } = await supabase
      .from("devices")
      .select("id, last_update")
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by day - count how many devices were online each day
    const dailyData = new Array(7).fill(0)
    const now = new Date()
    
    devices?.forEach((device) => {
      if (!device.last_update) return
      
      const lastUpdate = new Date(device.last_update)
      const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Count as online for all days since last update until now
      for (let i = daysDiff; i < 7; i++) {
        if (i >= 0 && i < 7) {
          dailyData[6 - i]++
        }
      }
    })

    // Generate labels (last 7 days)
    const labels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
    })

    return NextResponse.json({
      labels,
      data: dailyData
    })
  } catch (error: any) {
    console.error("Online history error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
