import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentUserProfile } = await supabase.from("users").select("role").eq("id", currentUser.id).single()

    if (currentUserProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (currentUser.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete user profile (auth user will be deleted by cascade)
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] DELETE /api/users/[id]/delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
