"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useSWRConfig } from "swr"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DeviceForm({ open, onOpenChange, device, onClose }: { open: boolean; onOpenChange: (open: boolean) => void; device: any; onClose: () => void }) {
  const { mutate } = useSWRConfig()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm()

  const isEditing = !!device

  useEffect(() => {
    if (open) {
      if (isEditing) {
        reset(device)
      } else {
        reset({ name: "", location: "", type: "", mqtt_topic: "" })
      }
    }
  }, [open, isEditing, device, reset])

  const onSubmit = async (data: any) => {
    try {
      const url = isEditing ? `/api/devices/${device.id}` : "/api/devices"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `เกิดข้อผิดพลาดในการ${isEditing ? "แก้ไข" : "สร้าง"}อุปกรณ์`)
      }

      mutate("/api/devices") // Revalidate SWR cache
      onClose() // Close dialog
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์ใหม่"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">ชื่ออุปกรณ์</Label>
            <Input id="name" {...register("name", { required: "กรุณากรอกชื่ออุปกรณ์" })} />
            {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
          </div>
          <div>
            <Label htmlFor="location">ตำแหน่ง</Label>
            <Input id="location" {...register("location")} />
          </div>
          <div>
            <Label htmlFor="type">ประเภท</Label>
            <Input id="type" {...register("type", { required: "กรุณากรอกประเภทอุปกรณ์" })} placeholder="e.g., Temperature, Motion" />
            {errors.type && <p className="text-red-500 text-sm mt-1">{String(errors.type.message)}</p>}
          </div>
          <div>
            <Label htmlFor="mqtt_topic">MQTT Topic</Label>
            <Input id="mqtt_topic" {...register("mqtt_topic", { required: "กรุณากรอก MQTT Topic" })} />
            {errors.mqtt_topic && <p className="text-red-500 text-sm mt-1">{String(errors.mqtt_topic.message)}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}