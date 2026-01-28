const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addStation1Device() {
  console.log('🔍 Checking for Station_1 device...')

  const deviceId = '46588dc3-c4d1-4269-b626-90116c8b97a4'

  // Check if device already exists
  const { data: existing, error: checkError } = await supabase
    .from('devices')
    .select('id, name')
    .eq('id', deviceId)
    .single()

  if (existing) {
    console.log('✅ Station_1 device already exists:', existing.name)
    return
  }

  console.log('📝 Creating Station_1 device...')

  // Get the first user (admin or any user)
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found. Please create a user first.')
    process.exit(1)
  }

  const userId = users[0].id
  console.log(`📌 Using user: ${users[0].email} (${userId})`)

  // Create Station_1 device
  const { data: newDevice, error: insertError } = await supabase
    .from('devices')
    .insert({
      id: deviceId,
      user_id: userId,
      name: 'Station 1 - Ammonia Sensor',
      type: 'ammonia',
      location: 'Test Location',
      mac_address: 'ESP32-Station1',
      mqtt_topic: 'iot/Station_1/ammonia',
      is_active: true,
      power: true,
      battery_level: 100,
      signal_strength: 85,
      last_update: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error creating device:', insertError.message)
    process.exit(1)
  }

  console.log('✅ Station_1 device created successfully!')
  console.log('Device ID:', deviceId)
  console.log('Name:', newDevice.name)
  console.log('Type:', newDevice.type)
  console.log('MQTT Topic:', newDevice.mqtt_topic)

  // Check sensor data count for this device
  const { count, error: countError } = await supabase
    .from('sensor_data')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', deviceId)

  if (!countError) {
    console.log(`📊 Sensor data entries for this device: ${count}`)
  }
}

addStation1Device().catch(console.error)
