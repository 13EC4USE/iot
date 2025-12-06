"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2, Edit2, Loader } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) throw new Error("Failed to update user role")
      fetchUsers()
      setEditingUserId(null)
    } catch (err: any) {
      alert(`ไม่สามารถอัพเดทสิทธิ์ได้: ${err.message}`)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUserId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${deletingUserId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to delete user")
      fetchUsers()
      setDeletingUserId(null)
    } catch (err: any) {
      alert(`ไม่สามารถลบผู้ใช้ได้: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">จัดการผู้ใช้</h1>
          <p className="text-foreground/60">ดูและจัดการผู้ใช้ทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* Statistics */}
      <Card className="p-4 border-border mb-8">
        <p className="text-xs uppercase tracking-wide text-foreground/60">ผู้ใช้ทั้งหมด</p>
        <p className="text-3xl font-semibold text-foreground">{users.length}</p>
      </Card>

      {/* Users Table */}
      <Card className="p-6 bg-card border-border overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-foreground/60" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">ไม่มีผู้ใช้ในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    ชื่อ
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    อีเมล
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    สิทธิ์
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    วันที่เข้าร่วม
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: User) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 hover:bg-background/50 transition"
                  >
                    <td className="py-3 px-4 text-foreground">{user.full_name || "-"}</td>
                    <td className="py-3 px-4 text-foreground text-sm">{user.email}</td>
                    <td className="py-3 px-4">
                      {editingUserId === user.id ? (
                        <div className="flex gap-2">
                          <Select
                            value={newRole}
                            onValueChange={(value) => setNewRole(value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleChangeRole(user.id, newRole)
                            }
                            className="bg-accent text-background hover:bg-accent/90"
                          >
                            บันทึก
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUserId(null)}
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}>
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString("th-TH")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(user.id)
                            setNewRole(user.role)
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingUserId(user.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
