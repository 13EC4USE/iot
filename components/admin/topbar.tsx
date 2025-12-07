"use client"

import { useRouter } from "next/navigation"
import { Bell, User, LogOut, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function TopBar() {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/admin/login")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">ยินดีต้อนรับ Admin</h1>
      </div>
      <div className="flex items-center gap-4 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'สลับเป็นธีมสว่าง' : 'สลับเป็นธีมมืด'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Bell className="w-5 h-5 text-foreground/60 cursor-pointer hover:text-foreground transition" />
        <div
          className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center cursor-pointer"
          onClick={() => setShowMenu(!showMenu)}
        >
          <User className="w-5 h-5 text-accent" />
        </div>
        {showMenu && (
          <div className="absolute right-0 top-12 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px] z-50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
