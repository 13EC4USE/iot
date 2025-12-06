import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isSuperAdmin } from "@/lib/utils/admin"

// =================================================
// GET /api/devices/[id]
// =================================================
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = isSuperAdmin(user.email)

    // Admin can view any device, regular user can only view their own
    let query = supabase.from("devices").select("*").eq("id", id)
    
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data: device, error } = await query.single()

    if (error || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =================================================
// PUT /api/devices/[id]
// =================================================
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = isSuperAdmin(user.email)
    const body = await request.json()

    // Admin can update any device, regular user can only update their own
    let query = supabase
      .from("devices")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data: device, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(device)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =================================================
// DELETE /api/devices/[id]
// =================================================
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("DELETE device: Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = isSuperAdmin(user.email)
    console.log(`DELETE device: user=${user.id}, deviceId=${id}, isAdmin=${isAdmin}`)

    // Admin can delete any device, regular user can only delete their own
    let query = supabase.from("devices").delete().eq("id", id)
    
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query.select()

    if (error) {
      console.error("DELETE device error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error("DELETE device: Device not found or not owned by user")
      return NextResponse.json({ error: "Device not found or you don't have permission" }, { status: 404 })
    }

    console.log("DELETE device success:", id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE device exception:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
