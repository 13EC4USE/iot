"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/admin/sidebar"
import { TopBar } from "@/components/admin/topbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Public admin routes that should render without authentication
  const publicRoutes = [
    "/admin/login",
    "/admin/sign-up",
    "/admin/forgot-password",
  ]

  useEffect(() => {
    const checkAuth = async () => {
      // Allow public admin routes (login, sign-up, forgot-password)
      const publicRoutes = [
        "/admin/login",
        "/admin/sign-up",
        "/admin/forgot-password",
      ]

      if (pathname && publicRoutes.some((r) => pathname.startsWith(r))) {
        setLoading(false)
        return
      }
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/admin/login")
      } else {
        setIsAuthenticated(true)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">กำลังโหลด...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // If this is a public admin route, allow rendering children (login, sign-up, forgot-password)
    if (pathname && publicRoutes.some((r) => pathname.startsWith(r))) {
      return (
        <div className="flex h-screen bg-background">
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
