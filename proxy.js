import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export default async function proxy(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // -------------------------
  // 1) PUBLIC ROUTES
  // -------------------------
  const publicRoutes = [
    "/admin/login",
    "/admin/sign-up",
    "/admin/forgot-password",
    "/admin", // Add /admin root as public (landing page)
    "/api/auth",
  ]

  const isPublic = publicRoutes.some((route) => {
    // Exact match for /admin (landing) or startsWith for others
    if (route === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(route)
  })
  if (isPublic) return NextResponse.next()

  // -------------------------
  // 2) PROTECTED ROUTES
  // -------------------------
  const protectedRoutes = [
    "/admin/dashboard",
    "/admin/devices",
    "/admin/control",
    "/admin/settings",
    "/admin/users",
  ]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  if (!isProtected) return NextResponse.next()

  // -------------------------
  // 3) SUPABASE SESSION CHECK
  // -------------------------
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Manual cookie parser (required for Next.js proxy)
  const cookieHeader = request.headers.get("cookie") || ""
  const cookiePairs = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)

  const cookieStore = cookiePairs
    .map((pair) => {
      const idx = pair.indexOf("=")
      if (idx === -1) return null
      return {
        name: pair.slice(0, idx),
        value: decodeURIComponent(pair.slice(idx + 1)),
      }
    })
    .filter(Boolean)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data, error } = await supabase.auth.getSession()

  // -------------------------
  // 4) REDIRECT IF NOT LOGGED IN
  // -------------------------
  if (error || !data.session) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
