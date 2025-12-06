import { createClient } from "@/lib/supabase/server"
import { userUpdateSchema } from "@/lib/validators/schemas"
import { NextResponse } from "next/server"
import { ZodError } from "zod"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Only allow users to view their own profile or admins to view all
    const { data: currentUserProfile } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

    if (currentUser.id !== id && currentUserProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[v0] GET /api/users/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: currentUserProfile } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

    if (currentUser.id !== id && currentUserProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    const { data: user, error } = await supabase.from("users").update(validatedData).eq("id", id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    console.error("[v0] PUT /api/users/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Update user role
    const { error } = await supabase
      .from("users")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("User update error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete user from public.users
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("User delete error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
