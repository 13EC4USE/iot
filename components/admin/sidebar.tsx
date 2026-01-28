"use client"

import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Wifi, Settings, LogOut, MapPin, Activity, GitBranch } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { href: "/admin/dashboard-v2", label: "📊 Dashboard (Live)", icon: LayoutDashboard },
    { href: "/admin/workflow", label: "ตรวจสอบ Workflow", icon: GitBranch },
    { href: "/admin/monitoring", label: "ติดตามระบบ", icon: Activity },
    { href: "/admin/map", label: "แผนที่", icon: MapPin },
    { href: "/admin/devices", label: "จัดการอุปกรณ์", icon: Wifi },
    { href: "/admin/alerts", label: "การแจ้งเตือน", icon: "🔔" },
    { href: "/admin/users", label: "ผู้ใช้", icon: "👥" },
    { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
  ]

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    router.push("/admin/login")
  }

  return (
    <div className="w-64 bg-card border-r border-border p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">IoT Hub</h2>
        <p className="text-xs text-foreground/60 mt-1">ระบบจัดการอุปกรณ์</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const IconComponent = typeof item.icon === "string" ? null : item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-accent/20 text-accent"
                  : "text-foreground/60 hover:bg-background/50 hover:text-foreground"
              }`}
            >
              {IconComponent ? (
                <IconComponent className="w-5 h-5" />
              ) : (
                <span className="text-lg">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-foreground/60 hover:bg-destructive/20 hover:text-destructive transition"
      >
        <LogOut className="w-5 h-5" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  )
}
