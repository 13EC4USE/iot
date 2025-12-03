;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const { createAdminClient } = require('../lib/supabase/admin.js')
    const supabase = createAdminClient()

    const topic = 'iot/temp/living-room'
    const payload = { value: 23.5, temperature: 23.5, unit: '°C', timestamp: new Date().toISOString() }

    const { data: device } = await supabase.from('devices').select('id,type').eq('mqtt_topic', topic).limit(1).single()
    if (!device) {
      console.error('No device with topic', topic)
      process.exit(1)
    }

    const { error } = await supabase.from('sensor_data').insert({
      device_id: device.id,
      value: payload.value,
      unit: payload.unit,
      temperature: payload.temperature,
      humidity: payload.humidity ?? null,
      timestamp: payload.timestamp,
    })

    if (error) {
      console.error('Insert error:', error)
      process.exit(1)
    }

    console.log('Inserted test sensor_data for device', device.id)
    process.exit(0)
  } catch (err) {
    console.error('ingest_test error:', err)
    process.exit(1)
  }
})()
