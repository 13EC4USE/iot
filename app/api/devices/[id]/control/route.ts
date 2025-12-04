import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishMessage } from "@/lib/mqtt/client";

//
// ===============================
//  Device Action Controller API
// ===============================
//
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // -------------------------------
    // 1) Auth
    // -------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // -------------------------------
    // 2) Input
    // -------------------------------
    const { action, value } = await request.json();
    const deviceId = params.id;

    // -------------------------------
    // 3) ตรวจว่า device เป็นของ user จริงไหม
    // -------------------------------
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("*")
      .eq("id", deviceId)
      .eq("user_id", user.id)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // ช่วยให้ใช้ได้สบาย
    const topicBase = device.mqtt_topic || `devices/${deviceId}`;

    //
    // ============================
    //  ACTION HANDLERS
    // ============================
    //

    // ---------------------------------------
    //  ACTION 1: POWER ON / POWER OFF
    // ---------------------------------------
    if (action === "power") {
      const topic = `${topicBase}/control/power`;

      publishMessage(topic, JSON.stringify({ power: value }));

      await supabase
        .from("devices")
        .update({
          power: !!value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId);

      return NextResponse.json({
        success: true,
        action,
        deviceId,
        power: value,
        message: value ? "เปิดอุปกรณ์สำเร็จ" : "ปิดอุปกรณ์สำเร็จ",
      });
    }

    // ---------------------------------------
    //  ACTION 2: SET THRESHOLD
    // ---------------------------------------
    if (action === "setThreshold") {
      const topic = `${topicBase}/control/threshold`;

      publishMessage(topic, JSON.stringify(value));

      await supabase.from("device_settings").upsert({
        device_id: deviceId,
        min_threshold: value.min,
        max_threshold: value.max,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        action,
        deviceId,
        threshold: value,
        message: "ตั้งค่า Threshold สำเร็จ",
      });
    }

    // ---------------------------------------
    //  ACTION TEMPLATE (คุณเพิ่มเองได้ง่าย)
    // ---------------------------------------
    if (action === "mode") {
      const topic = `${topicBase}/control/mode`;
      publishMessage(topic, JSON.stringify({ mode: value }));

      await supabase.from("devices").update({
        mode: value,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        action,
        mode: value,
        deviceId,
        message: `ตั้งค่าโหมด: ${value}`,
      });
    }

    // ---------------------------------------
    //  ACTION ไม่รู้จัก
    // ---------------------------------------
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
