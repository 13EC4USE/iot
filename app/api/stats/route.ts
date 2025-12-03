import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const stats = {
    totalDevices: 4,
    onlineDevices: 3,
    offlineDevices: 1,
    totalDataPoints: 2400,
    totalAlerts: 156,
    activeSessions: 5,
    systemUptime: "45 days",
    averageResponseTime: "152ms",
    dataStorageUsed: "2.4 GB",
    dataStorageLimit: "100 GB",
  }

  return NextResponse.json({
    success: true,
    stats,
    generatedAt: new Date().toISOString(),
  })
}
