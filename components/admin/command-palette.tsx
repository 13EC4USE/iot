"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  Wifi,
  Bell,
  Users,
  Settings,
  Plus,
  Search,
  Activity,
  BarChart3,
  Power,
  Gauge,
  AlertCircle,
  MapPin,
} from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  const handleSelect = (callback: () => void) => {
    callback()
    onOpenChange(false)
  }

  const navigationCommands = [
    {
      icon: LayoutDashboard,
      label: "แดshบอร์ด",
      action: () => router.push("/admin/dashboard"),
      keywords: ["dashboard", "home", "overview"],
    },
    {
      icon: MapPin,
      label: "แผนที่",
      action: () => router.push("/admin/map"),
      keywords: ["map", "location", "tracking", "แผนที่"],
    },
    {
      icon: Wifi,
      label: "จัดการอุปกรณ์",
      action: () => router.push("/admin/devices"),
      keywords: ["devices", "manage", "iot"],
    },
    {
      icon: Bell,
      label: "การแจ้งเตือน",
      action: () => router.push("/admin/alerts"),
      keywords: ["alerts", "notifications"],
    },
    {
      icon: Activity,
      label: "ควบคุมอุปกรณ์",
      action: () => router.push("/admin/control"),
      keywords: ["control", "mqtt", "commands"],
    },
    {
      icon: Users,
      label: "ผู้ใช้",
      action: () => router.push("/admin/users"),
      keywords: ["users", "accounts"],
    },
    {
      icon: Settings,
      label: "ตั้งค่า",
      action: () => router.push("/admin/settings"),
      keywords: ["settings", "configuration"],
    },
  ]

  const actionCommands = [
    {
      icon: Plus,
      label: "เพิ่มอุปกรณ์ใหม่",
      action: () => router.push("/admin/devices?action=add"),
      keywords: ["add", "new", "device", "create"],
    },
    {
      icon: Search,
      label: "ค้นหาอุปกรณ์",
      action: () => router.push("/admin/devices"),
      keywords: ["search", "find", "device"],
    },
    {
      icon: BarChart3,
      label: "ดูสถิติระบบ",
      action: () => router.push("/admin/dashboard#stats"),
      keywords: ["stats", "analytics", "reports"],
    },
    {
      icon: AlertCircle,
      label: "ดูการแจ้งเตือนทั้งหมด",
      action: () => router.push("/admin/alerts"),
      keywords: ["alerts", "notifications", "warnings"],
    },
  ]

  const quickActions = [
    {
      icon: Power,
      label: "เปิด/ปิดอุปกรณ์ทั้งหมด",
      action: () => {
        // This would trigger a global device power toggle
        console.log("Toggle all devices")
      },
      keywords: ["power", "toggle", "all devices"],
    },
    {
      icon: Gauge,
      label: "ดู MQTT Broker Status",
      action: () => router.push("/admin/control#mqtt"),
      keywords: ["mqtt", "broker", "status"],
    },
  ]

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="พิมพ์คำสั่งหรือค้นหา..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>ไม่พบคำสั่งที่ตรงกัน</CommandEmpty>
        
        <CommandGroup heading="การนำทาง">
          {navigationCommands.map((cmd, idx) => (
            <CommandItem
              key={idx}
              onSelect={() => handleSelect(cmd.action)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="การดำเนินการ">
          {actionCommands.map((cmd, idx) => (
            <CommandItem
              key={idx}
              onSelect={() => handleSelect(cmd.action)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((cmd, idx) => (
            <CommandItem
              key={idx}
              onSelect={() => handleSelect(cmd.action)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <cmd.icon className="w-4 h-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
