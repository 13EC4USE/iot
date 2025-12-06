import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { publishMessage } from "@/lib/mqtt/client"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { topic, message } = await request.json()

    if (!topic || !message) {
      return NextResponse.json(
        { error: "Missing required fields: topic, message" },
        { status: 400 }
      )
    }

    // Validate topic format (basic security check)
    if (typeof topic !== "string" || topic.length === 0 || topic.length > 256) {
      return NextResponse.json(
        { error: "Invalid topic format" },
        { status: 400 }
      )
    }

    // Parse message to ensure it's valid JSON (if it's a string)
    let messagePayload = message
    if (typeof message === "string") {
      try {
        messagePayload = JSON.parse(message)
      } catch {
        // If not JSON, send as-is
      }
    }

    // Optional: Verify user has permission to publish to this device
    // Extract device ID from topic or message
    let deviceId: string | null = null
    if (typeof messagePayload === "object" && messagePayload.id) {
      deviceId = messagePayload.id
    }

    if (deviceId) {
      // Verify device ownership
      const { data: device, error: deviceError } = await supabase
        .from("devices")
        .select("id, user_id")
        .eq("id", deviceId)
        .single()

      if (deviceError || !device || device.user_id !== user.id) {
        return NextResponse.json(
          { error: "Device not found or unauthorized" },
          { status: 403 }
        )
      }
    }

    // Publish message via MQTT
    const messageStr = typeof messagePayload === "string" 
      ? messagePayload 
      : JSON.stringify(messagePayload)

    const success = await publishMessage(topic, messageStr)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to publish message to MQTT broker" },
        { status: 500 }
      )
    }

    // Log the control action (optional)
    console.log(`[MQTT Publish] User: ${user.email}, Topic: ${topic}, Message: ${messageStr}`)

    return NextResponse.json({
      success: true,
      topic,
      message: messagePayload,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("MQTT Publish API Error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
