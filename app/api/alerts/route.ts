import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

//
// -------------------------
//   GET Alerts
// -------------------------
//
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = request.nextUrl.searchParams;
    const deviceId = search.get("deviceId");
    const limit = Number(search.get("limit") || "20");

    // SQL query with user-level filtering
    let query = supabase
      .from("device_alerts")
      .select(
        `
        *,
        devices!inner (
          id,
          user_id,
          name,
          type,
          location
        )
      `
      ) // INNER JOIN enforces correct user restrictions
      .eq("devices.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq("device_id", deviceId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch alerts", details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      alerts: data,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

//
// -------------------------
//   POST Alerts
// -------------------------
//
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // validate device owner directly in DB
    const { data: device, error: deviceErr } = await supabase
      .from("devices")
      .select("id, user_id")
      .eq("id", body.device_id)
      .eq("user_id", user.id)
      .single();

    if (deviceErr || !device) {
      return NextResponse.json({ error: "Device not found or permission denied" }, { status: 404 });
    }

    // insert alert
    const { data: alert, error } = await supabase
      .from("device_alerts")
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "สร้างการแจ้งเตือนสำเร็จ",
      alert,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
