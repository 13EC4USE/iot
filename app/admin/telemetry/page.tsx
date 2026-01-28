"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TelemetryPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Telemetry ถูกปิดใช้งาน</CardTitle>
          <CardDescription>
            หน้านี้ถูกปิดตามโครงสร้างระบบใหม่ที่ใช้ MQTT แบบ backend-only. กรุณาใช้แดชบอร์ดและหน้าจัดการอุปกรณ์แทน.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            หากต้องการเปิด telemetry แบบสดอีกครั้ง แจ้งให้เราทราบเพื่อปรับแต่งให้เหมาะกับงาน.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
