"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setSent(true)
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-teal-500/20">
          <h1 className="text-3xl font-bold text-white mb-2">ลืมรหัสผ่าน</h1>
          <p className="text-slate-400 mb-6">ป้อนอีเมลของคุณเพื่อรับลิงก์รีเซต</p>

          {sent ? (
            <div className="bg-teal-500/10 border border-teal-500 rounded p-4 text-teal-400 mb-6">
              ตรวจสอบอีเมลของคุณสำหรับลิงก์รีเซตรหัสผ่าน
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500 rounded p-4 text-red-400 mb-6">{error}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                placeholder="your@email.com"
                required
                disabled={sent}
              />
            </div>

            <button
              type="submit"
              disabled={loading || sent}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? "กำลังส่ง..." : sent ? "ส่งแล้ว" : "ส่งลิงก์รีเซต"}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            <Link href="/admin/login" className="text-teal-400 hover:text-teal-300">
              กลับไปเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
