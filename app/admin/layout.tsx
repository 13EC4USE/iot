import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/admin/sidebar"
import { TopBar } from "@/components/admin/topbar"
import { ToastContainer } from "@/components/toast-container"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // load user session on the server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't need auth UI
  const publicPaths = ["/admin/login", "/admin/sign-up", "/admin/forgot-password"]
  // Can't easily get pathname in layout; rely on proxy.js for redirect
  // Here: if no user, render children without admin UI (for login page)
  if (!user) {
    return (
      <main className="flex-1 overflow-auto">
        {children}
        <ToastContainer />
      </main>
    )
  }

  // -------------------------------
  //  AUTH SUCCESS → SHOW ADMIN UI
  // -------------------------------
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
        <ToastContainer />
      </div>
    </div>
  )
}
