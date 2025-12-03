"use client"

import { useRouter } from "next/navigation"
import { Bell, User } from "lucide-react"

export function TopBar() {
  const router = useRouter()

  return (
    <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">ยินดีต้อนรับ Admin</h1>
      </div>
      <div className="flex items-center gap-4">
        <Bell className="w-5 h-5 text-foreground/60 cursor-pointer hover:text-foreground transition" />
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center cursor-pointer">
          <User className="w-5 h-5 text-accent" />
        </div>
      </div>
    </div>
  )
}
