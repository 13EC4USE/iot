"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to fetch users")
        return
      }

      setUsers(data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch users")
      console.error("[v0] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "ไม่สามารถอัปเดตบทบาท")
        return
      }

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      console.error("[v0] Update error:", err)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("คุณแน่ใจหรือว่าต้องการลบผู้ใช้นี้?")) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        alert("ไม่สามารถลบผู้ใช้")
        return
      }

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      console.error("[v0] Delete error:", err)
      alert("เกิดข้อผิดพลาด")
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">จัดการผู้ใช้</h1>
        <p className="text-slate-400">มีผู้ใช้ทั้งหมด {users.length} คน</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-400">{error}</div>}

      <div className="bg-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-slate-300">อีเมล</th>
              <th className="px-4 py-3 text-left text-slate-300">ชื่อ</th>
              <th className="px-4 py-3 text-left text-slate-300">บทบาท</th>
              <th className="px-4 py-3 text-left text-slate-300">วันที่สร้าง</th>
              <th className="px-4 py-3 text-left text-slate-300">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  กำลังโหลด...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  ไม่มีผู้ใช้
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-slate-600 hover:bg-slate-600/50">
                  <td className="px-4 py-3 text-white">{user.email}</td>
                  <td className="px-4 py-3 text-white">{user.full_name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded border border-slate-500 focus:outline-none focus:border-teal-500"
                    >
                      <option value="user">ผู้ใช้</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400 hover:text-red-300 transition text-sm font-medium"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
