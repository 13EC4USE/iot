"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@iot.com")
  const [password, setPassword] = useState("password123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [checking, setChecking] = useState(true)

  // Check if already logged in on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.replace("/admin/dashboard")
          return
        }
      } catch (err) {
        console.error("Session check error:", err)
      } finally {
        setChecking(false)
      }
    }
    checkSession()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-foreground/60">กำลังตรวจสอบ...</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setEmailError("")

    // Basic client-side validation
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError('โปรดใส่อีเมลที่ถูกต้อง')
      setLoading(false)
      return
    }

    if (!password || password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // If Supabase auth fails, show message and suggest reset
        setError(authError.message || "เข้าสู่ระบบล้มเหลว")
        return
      }

      // On success redirect to dashboard
      router.replace("/admin/dashboard")
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md p-8 bg-card border-border relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-accent/20 rounded-lg mb-4">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">หลังบ้าน IoT</h1>
          <p className="text-foreground/60">เข้าสู่ระบบเพื่อจัดการอุปกรณ์ของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iot.com"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-accent text-background hover:bg-accent/90 h-10">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-foreground/60">
          <div className="text-xs">บัญชีทดสอบ: admin@iot.com / password123</div>
          <div className="flex gap-4">
            <a href="/admin/sign-up" className="text-accent hover:underline">สร้างบัญชี</a>
            <a href="/admin/forgot-password" className="text-accent hover:underline">ลืมรหัสผ่าน?</a>
          </div>
        </div>
      </Card>
    </div>
  )
}
