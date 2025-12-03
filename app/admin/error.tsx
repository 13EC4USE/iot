"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-400 mb-4">เกิดข้อผิดพลาด</h1>
        <h2 className="text-2xl font-bold text-white mb-4">ไม่สามารถโหลดหน้าแอดมิน</h2>
        <p className="text-slate-400 mb-8 max-w-md">{error.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด"}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition"
          >
            ลองใหม่
          </button>
          <Link
            href="/admin/dashboard"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            กลับแดชบอร์ด
          </Link>
        </div>
      </div>
    </div>
  )
}
