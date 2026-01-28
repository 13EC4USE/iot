/**
 * Topic Normalizer - ทำให้ payload จาก topic ต่างๆ เป็นโครงสร้างเดียวกัน
 * รองรับรูปแบบ:
 * - sensors/ammonia (จาก ESP32 เดิม)
 * - iot/{device_id}/ammonia (รูปแบบใหม่)
 * - iot/sensors/ammonia/{device_id}
 */

export interface NormalizedPayload {
  device_id: string
  ammonia?: number
  temperature?: number
  humidity?: number
  battery?: number
  timestamp?: string
  raw?: any
}

export interface TopicInfo {
  raw: string
  normalized: string
  device_id: string | null
}

/**
 * แยก device_id จาก topic
 * - iot/Station_1/ammonia → Station_1
 * - sensors/ammonia → null (ต้องดูจาก payload)
 */
export function extractDeviceFromTopic(topic: string): TopicInfo {
  const parts = topic.split("/")
  
  // รูปแบบ: iot/{device_id}/ammonia
  if (parts[0] === "iot" && parts.length >= 3) {
    return {
      raw: topic,
      normalized: parts.slice(2).join("/"),
      device_id: parts[1],
    }
  }
  
  // รูปแบบ: sensors/ammonia หรือ sensors/ammonia/{device_id}
  if (parts[0] === "sensors") {
    return {
      raw: topic,
      normalized: parts[1] || "unknown",
      device_id: parts[2] || null,
    }
  }
  
  return {
    raw: topic,
    normalized: topic,
    device_id: null,
  }
}

/**
 * Normalize payload จากรูปแบบต่างๆ ให้เป็นโครงสร้างเดียว
 */
export function normalizePayload(
  topic: string,
  payload: any
): NormalizedPayload | null {
  try {
    const topicInfo = extractDeviceFromTopic(topic)
    
    // ถ้า payload เป็น string ให้ parse เป็น JSON
    const parsed = typeof payload === "string" 
      ? (() => { try { return JSON.parse(payload) } catch { return null } })()
      : payload

    if (!parsed || typeof parsed !== "object") {
      return null
    }

    // ดึง device_id จาก topic หรือ payload
    const device_id = 
      topicInfo.device_id || 
      parsed.id || 
      parsed.device_id || 
      parsed.deviceId ||
      "unknown"

    // สร้าง normalized payload
    const normalized: NormalizedPayload = {
      device_id,
      ammonia: parsed.ammonia ?? parsed.nh3 ?? parsed.NH3 ?? parsed.value,
      temperature: parsed.temperature ?? parsed.temp ?? parsed.t,
      humidity: parsed.humidity ?? parsed.hum ?? parsed.h,
      battery: parsed.battery ?? parsed.battery_level ?? parsed.batteryLevel,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
      raw: parsed,
    }

    return normalized
  } catch (error) {
    console.error("[normalizer] Error:", error)
    return null
  }
}

/**
 * กรอง payload ที่มาจาก device_id ที่ระบุ
 */
export function filterByDevice(
  normalized: NormalizedPayload,
  deviceIds: string[]
): boolean {
  if (deviceIds.length === 0) return true
  return deviceIds.some(id => 
    normalized.device_id.toLowerCase().includes(id.toLowerCase())
  )
}

/**
 * แปลง topic รูปแบบเก่าเป็นรูปแบบใหม่
 * sensors/ammonia → iot/{device_id}/ammonia
 */
export function migrateTopicFormat(
  oldTopic: string,
  deviceId: string,
  prefix: string = "iot"
): string {
  const parts = oldTopic.split("/")
  
  // ถ้าเป็น sensors/ammonia แล้ว
  if (parts[0] === "sensors" && parts[1]) {
    return `${prefix}/${deviceId}/${parts[1]}`
  }
  
  // ถ้าเป็นรูปแบบอื่น ให้คืนค่าเดิม
  return oldTopic
}

/**
 * ตรวจสอบว่า payload ครบถ้วนหรือไม่
 */
export function validatePayload(payload: NormalizedPayload): {
  valid: boolean
  missing: string[]
} {
  const required = ["device_id"]
  const optional = ["ammonia", "temperature", "humidity"]
  
  const missing: string[] = []
  
  for (const field of required) {
    if (!payload[field as keyof NormalizedPayload]) {
      missing.push(field)
    }
  }
  
  // ต้องมีอย่างน้อย 1 ค่าจาก optional
  const hasData = optional.some(field => 
    payload[field as keyof NormalizedPayload] !== undefined
  )
  
  if (!hasData) {
    missing.push("data (ammonia/temperature/humidity)")
  }
  
  return {
    valid: missing.length === 0,
    missing,
  }
}
