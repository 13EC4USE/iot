import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function proxy(request) {
  const requestUrl = new URL(request.url)
  const pathname = requestUrl.pathname

  // Skip middleware for public routes
  const publicRoutes = ["/admin/login", "/admin/sign-up", "/admin/forgot-password", "/api/auth"]

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const protectedRoutes = ["/admin/dashboard", "/admin/devices", "/admin/control", "/admin/settings", "/admin/users"]

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Create Supabase client for middleware
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  // Build a simple cookie store from the incoming Cookie header so Supabase
  // server client can read session cookies during this proxy request.
  const cookieHeader = request.headers.get('cookie') || ''
  const cookiePairs = cookieHeader.split(';').map((c) => c.trim()).filter(Boolean)
  const cookieStore = cookiePairs.map((pair) => {
    const idx = pair.indexOf('=')
    if (idx === -1) return null
    const name = pair.slice(0, idx)
    const value = decodeURIComponent(pair.slice(idx + 1))
    return { name, value }
  }).filter(Boolean)

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refresh session if needed
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
