;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const { createAdminClient } = require('../lib/supabase/admin.js')
    const supabase = createAdminClient()

    console.log('Listing auth users...')
    const listRes = await supabase.auth.admin.listUsers()
    const users = listRes?.data?.users || listRes?.data || []

    for (const u of users) {
      const id = u.id
      const email = u.email
      const full_name = (u.user_metadata && u.user_metadata.full_name) || null
      const role = (u.user_metadata && u.user_metadata.role) || (u.app_metadata && u.app_metadata.role) || 'user'

      // Ensure public.users has a row for this id
      const { data: existing } = await supabase.from('users').select('id').eq('id', id).single()
      if (!existing) {
        const { error: insertErr } = await supabase.from('users').insert({ id, email, full_name, role })
        if (insertErr) console.error('Failed to insert public.user for', email, insertErr.message || insertErr)
        else console.log('Inserted public.user for', email)
      } else {
        console.log('public.user exists for', email)
      }
    }

    // Find test user to attach devices
    const { data: testUserProfiles } = await supabase.from('users').select('*').eq('email', 'user@iot.com').limit(1)
    const testUser = testUserProfiles && testUserProfiles[0]

    if (!testUser) {
      console.log('Test user not found in public.users (user@iot.com). Skipping device seeding.')
      process.exit(0)
    }

    const userId = testUser.id
    console.log('Seeding devices for user id', userId)

    const devices = [
      {
        user_id: userId,
        name: 'Temperature Sensor - Living Room',
        type: 'temperature',
        location: 'Living Room',
        mac_address: 'AA:BB:CC:DD:EE:01',
        mqtt_topic: 'iot/temp/living-room',
        is_active: true,
        power: true,
        battery_level: 95,
        signal_strength: 85,
      },
      {
        user_id: userId,
        name: 'Humidity Sensor - Bedroom',
        type: 'humidity',
        location: 'Bedroom',
        mac_address: 'AA:BB:CC:DD:EE:02',
        mqtt_topic: 'iot/humidity/bedroom',
        is_active: true,
        power: true,
        battery_level: 88,
        signal_strength: 90,
      },
      {
        user_id: userId,
        name: 'Motion Sensor - Kitchen',
        type: 'motion',
        location: 'Kitchen',
        mac_address: 'AA:BB:CC:DD:EE:03',
        mqtt_topic: 'iot/motion/kitchen',
        is_active: true,
        power: true,
        battery_level: 92,
        signal_strength: 88,
      },
      {
        user_id: userId,
        name: 'Smart Light - Hallway',
        type: 'light',
        location: 'Hallway',
        mac_address: 'AA:BB:CC:DD:EE:04',
        mqtt_topic: 'iot/light/hallway',
        is_active: true,
        power: true,
        battery_level: 100,
        signal_strength: 95,
      },
    ]

    // Insert devices if they don't already exist (by mqtt_topic or mac_address)
    for (const d of devices) {
      const { data: existing } = await supabase.from('devices').select('id').or(`mqtt_topic.eq.${d.mqtt_topic},mac_address.eq.${d.mac_address}`).limit(1).single()
      if (existing) {
        console.log('Device exists, skipping:', d.mqtt_topic)
        continue
      }
      const { data: inserted, error: insErr } = await supabase.from('devices').insert(d).select().single()
      if (insErr) console.error('Devices creation error:', insErr.message || insErr)
      else console.log('Inserted device:', inserted.id)

      // For each device insert some sensor_data
      if (inserted) {
        const sensorDataRecords = []
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 3600000)
          sensorDataRecords.push({
            device_id: inserted.id,
            value: Math.random() * 100,
            unit: inserted.type === 'temperature' ? '°C' : inserted.type === 'humidity' ? '%' : 'units',
            temperature: inserted.type === 'temperature' ? 20 + Math.random() * 10 : null,
            humidity: inserted.type === 'humidity' ? 40 + Math.random() * 40 : null,
            timestamp: timestamp.toISOString(),
          })
        }
        const { error: sensorErr } = await supabase.from('sensor_data').insert(sensorDataRecords)
        if (sensorErr) console.error('Sensor data creation error:', sensorErr.message || sensorErr)
        else console.log('Inserted sensor data records for', inserted.id)

        // Create device settings
        const settings = {
          device_id: inserted.id,
          min_threshold: 15,
          max_threshold: 35,
          alert_enabled: true,
          update_interval: 60,
        }
        const { error: settingsError } = await supabase.from('device_settings').insert(settings)
        if (settingsError) console.error('Settings creation error:', settingsError.message || settingsError)
        else console.log('Inserted settings for', inserted.id)

        // Create sample alerts
        const alert = {
          device_id: inserted.id,
          type: 'threshold_exceeded',
          severity: 'warning',
          message: `${inserted.name} temperature exceeded threshold`,
          is_read: false,
        }
        const { error: alertsError } = await supabase.from('device_alerts').insert(alert)
        if (alertsError) console.error('Alerts creation error:', alertsError.message || alertsError)
        else console.log('Inserted alert for', inserted.id)
      }
    }

    console.log('Sync and seed completed')
    process.exit(0)
  } catch (err) {
    console.error('Sync and seed error:', err)
    process.exit(1)
  }
})()
