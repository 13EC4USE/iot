"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lock, Mail, User } from "lucide-react"

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const supabase = createClient()

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
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
  }, [router, supabase])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center">
        <div className="text-foreground/60">กำลังตรวจสอบ...</div>
      </div>
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        alert("ลงทะเบียนสำเร็จ! โปรดตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี (หรือติดต่อ admin)")
        router.push("/admin/login")
        setLoading(false)
        return
      }

      if (authData.user) {
        // Profile will be created by trigger (002_create_profiles_trigger.sql)
        // Or manually upsert to be safe
        const { error: profileError } = await supabase.from("users").upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: "user",
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't block signup if profile insert fails
        }

        alert("ลงทะเบียนสำเร็จ! กำลัง redirect ไปหน้า login...")
        router.push("/admin/login")
      }
    } catch (err) {
      console.error("Signup error:", err)
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
            <User className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-foreground/60">เข้าร่วมระบบจัดการ IoT</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">ชื่อเต็ม</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="ชื่อเต็มของคุณ"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="your@email.com"
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
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">ยืนยันรหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-foreground/40" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="ยืนยันรหัสผ่าน"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-accent text-background hover:bg-accent/90 h-10">
            {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-foreground/60">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/admin/login" className="text-accent hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </Card>
    </div>
  )
}
