"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-teal-400 mb-4">500</h1>
        <h2 className="text-3xl font-bold text-white mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-slate-400 mb-8 max-w-md">ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองใหม่</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition"
          >
            ลองใหม่
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  )
}
