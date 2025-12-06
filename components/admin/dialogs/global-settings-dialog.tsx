"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { useToast } from "@/lib/hooks/useToast"

interface GlobalSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSettingsDialog({ open, onOpenChange }: GlobalSettingsDialogProps) {
  const [interval, setInterval] = useState(30) // default 30 minutes
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSave = async () => {
    try {
      setLoading(true)
      // Save to localStorage (persistent on client)
      localStorage.setItem("mqtt_reporting_interval", interval.toString())
      
      // Optionally save to server
      const res = await fetch("/api/settings/mqtt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporting_interval: interval })
      })

      if (res.ok) {
        toast.success(`ตั้งค่า MQTT interval เป็น ${interval} นาที`)
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "ตั้งค่าล้มเหลว")
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ตั้งค่าระบบ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* MQTT Reporting Interval */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ช่วงเวลารายงาน MQTT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-3 block">
                  อุปกรณ์จะส่งข้อมูลทุก {interval} นาที
                </Label>
                <Slider
                  value={[interval]}
                  onValueChange={(v) => setInterval(v[0])}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">เลือกช่วงเวลา:</span>
                <div className="flex gap-2">
                  {[10, 15, 30, 60].map((val) => (
                    <Button
                      key={val}
                      size="sm"
                      variant={interval === val ? "default" : "outline"}
                      onClick={() => setInterval(val)}
                      className="h-8"
                    >
                      {val} นม.
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                💡 ช่วงสั้นจะใช้พลังงานมากขึ้น แต่ข้อมูลจะปรากฏเร็วขึ้น
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• ค่านี้จะถูกส่งไปให้อุปกรณ์ทั้งหมด</p>
            <p>• อุปกรณ์จะต้องรีสตาร์ทเพื่อใช้ค่าใหม่</p>
            <p>• ข้อมูลคำสั่งจะเก็บใน localStorage และ Server</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
