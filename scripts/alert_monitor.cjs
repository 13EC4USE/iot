/**
 * Alert Monitor Service
 * ตรวจสอบสถานะอุปกรณ์และสร้างการแจ้งเตือนอัตโนมัติ
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Alert thresholds
const THRESHOLDS = {
  battery_low: 20,
  offline_minutes: 10,
  temperature_high: 35,
  temperature_low: 10,
  humidity_high: 80,
  humidity_low: 20,
}

// Track already sent alerts to avoid duplicates
const sentAlerts = new Map()

async function checkDeviceStatus() {
  try {
    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching devices:', error)
      return
    }

    for (const device of devices) {
      // Check battery level
      if (device.battery_level !== null && device.battery_level < THRESHOLDS.battery_low) {
        await createAlert(device, 'battery_low', 'warning', 
          `แบตเตอรี่ของ ${device.name} ต่ำเหลือ ${device.battery_level}%`)
      }

      // Check offline status
      if (device.last_update) {
        const lastUpdate = new Date(device.last_update)
        const now = new Date()
        const minutesOffline = (now - lastUpdate) / (1000 * 60)

        if (minutesOffline > THRESHOLDS.offline_minutes) {
          await createAlert(device, 'device_offline', 'critical',
            `${device.name} ออฟไลน์มานานกว่า ${Math.floor(minutesOffline)} นาที`)
        }
      }
    }
  } catch (error) {
    console.error('Error checking device status:', error)
  }
}

async function checkSensorData() {
  try {
    // Get recent sensor data (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: sensorData, error } = await supabase
      .from('sensor_data')
      .select(`
        *,
        devices (id, name, user_id, type)
      `)
      .gte('timestamp', fiveMinutesAgo)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching sensor data:', error)
      return
    }

    // Group by device and check latest values
    const deviceMap = new Map()
    for (const data of sensorData) {
      if (!deviceMap.has(data.device_id)) {
        deviceMap.set(data.device_id, data)
      }
    }

    for (const [deviceId, data] of deviceMap) {
      const device = data.devices

      // Temperature checks
      if (data.temperature !== null) {
        if (data.temperature > THRESHOLDS.temperature_high) {
          await createAlert(device, 'threshold_exceeded', 'warning',
            `อุณหภูมิของ ${device.name} สูง: ${data.temperature}°C`)
        } else if (data.temperature < THRESHOLDS.temperature_low) {
          await createAlert(device, 'threshold_exceeded', 'warning',
            `อุณหภูมิของ ${device.name} ต่ำ: ${data.temperature}°C`)
        }
      }

      // Humidity checks
      if (data.humidity !== null) {
        if (data.humidity > THRESHOLDS.humidity_high) {
          await createAlert(device, 'threshold_exceeded', 'warning',
            `ความชื้นของ ${device.name} สูง: ${data.humidity}%`)
        } else if (data.humidity < THRESHOLDS.humidity_low) {
          await createAlert(device, 'threshold_exceeded', 'info',
            `ความชื้นของ ${device.name} ต่ำ: ${data.humidity}%`)
        }
      }
    }
  } catch (error) {
    console.error('Error checking sensor data:', error)
  }
}

async function createAlert(device, type, severity, message) {
  // Prevent duplicate alerts (within 30 minutes)
  const alertKey = `${device.id}-${type}`
  const lastAlert = sentAlerts.get(alertKey)
  const now = Date.now()

  if (lastAlert && (now - lastAlert) < 30 * 60 * 1000) {
    return // Skip duplicate
  }

  try {
    const { error } = await supabase
      .from('device_alerts')
      .insert({
        device_id: device.id,
        type,
        severity,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      sentAlerts.set(alertKey, now)
      console.log(`✓ Alert created: ${message}`)
    } else {
      console.error('Error creating alert:', error)
    }
  } catch (error) {
    console.error('Error in createAlert:', error)
  }
}

// Clean up old alert tracking (every hour)
function cleanupAlertTracking() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [key, timestamp] of sentAlerts.entries()) {
    if (timestamp < oneHourAgo) {
      sentAlerts.delete(key)
    }
  }
}

// Main monitoring loop
async function startMonitoring() {
  console.log('🚀 Alert Monitor Service started')
  console.log('Thresholds:', THRESHOLDS)

  // Initial check
  await checkDeviceStatus()
  await checkSensorData()

  // Check device status every 2 minutes
  setInterval(checkDeviceStatus, 2 * 60 * 1000)

  // Check sensor data every 1 minute
  setInterval(checkSensorData, 1 * 60 * 1000)

  // Cleanup every hour
  setInterval(cleanupAlertTracking, 60 * 60 * 1000)
}

// Start the service
if (require.main === module) {
  startMonitoring().catch(console.error)
}

module.exports = { startMonitoring, checkDeviceStatus, checkSensorData }
