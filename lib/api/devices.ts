import { createClient } from "@/lib/supabase/server"

export async function getUserDevices() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getDeviceWithSettings(deviceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select(
      `
      *,
      device_settings(*),
      sensor_data(count)
    `,
    )
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .single()

  if (deviceError) throw deviceError
  return device
}

export async function createDeviceAlert(deviceId: string, type: string, message: string, severity = "warning") {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  // Verify device ownership
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .single()

  if (deviceError || !device) {
    throw new Error("Device not found")
  }

  const { data, error } = await supabase
    .from("device_alerts")
    .insert({
      device_id: deviceId,
      type,
      message,
      severity,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDeviceSensorData(deviceId: string, limit = 100) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  // Verify device ownership
  const { data: device } = await supabase
    .from("devices")
    .select("id")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .single()

  if (!device) {
    throw new Error("Device not found")
  }

  const { data, error } = await supabase
    .from("sensor_data")
    .select("*")
    .eq("device_id", deviceId)
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
