;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const { createAdminClient } = require('../lib/supabase/admin.js')
    const supabase = createAdminClient()

    console.log('--- Supabase API test ---')

    // List users
    const usersRes = await supabase.from('users').select('id,email,full_name,role,created_at')
    if (usersRes.error) console.error('users list error:', usersRes.error)
    else console.log('users:', usersRes.data)

    // Pick a user to test devices for (user@iot.com if exists)
    const user = usersRes.data && usersRes.data.find((u) => u.email === 'user@iot.com')
    if (!user) {
      console.log('Test user user@iot.com not found in public.users, aborting device queries')
      process.exit(0)
    }

    console.log('Testing device queries for user id', user.id)

    const devicesRes = await supabase.from('devices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (devicesRes.error) console.error('devices query error:', devicesRes.error)
    else console.log('devices for user:', devicesRes.data.map((d) => ({ id: d.id, name: d.name, mqtt_topic: d.mqtt_topic })))

    if (devicesRes.data && devicesRes.data.length > 0) {
      const first = devicesRes.data[0]
      const sensorRes = await supabase.from('sensor_data').select('*').eq('device_id', first.id).order('timestamp', { ascending: false }).limit(5)
      if (sensorRes.error) console.error('sensor_data error:', sensorRes.error)
      else console.log('recent sensor_data for first device:', sensorRes.data)
    }

    console.log('API test completed')
    process.exit(0)
  } catch (err) {
    console.error('api_test error:', err)
    process.exit(1)
  }
})()
