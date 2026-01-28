const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAPIResponse() {
  console.log('🧪 Testing API Response Format\n')

  // Simulate /api/devices/recent logic
  console.log('1️⃣ Testing /api/devices/recent...')
  
  const { data: devices, error } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      type,
      location,
      is_active,
      last_update,
      updated_at,
      created_at,
      battery_level,
      signal_strength,
      user_id
    `)
    .order('last_update', { ascending: false, nullsFirst: false })
    .limit(5)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  console.log(`   Found ${devices.length} devices`)

  // Get latest data for each device
  const enriched = await Promise.all(
    (devices || []).map(async (device) => {
      const { data: latestData } = await supabase
        .from('sensor_data')
        .select('value, unit, temperature, humidity, timestamp')
        .eq('device_id', device.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      return {
        ...device,
        lastData: latestData || null
      }
    })
  )

  console.log('\n📋 API Response:')
  console.log(JSON.stringify({
    devices: enriched,
    total: devices.length,
    limit: 5,
    offset: 0
  }, null, 2))

  // Check Station_1 specifically
  const station1 = enriched.find(d => d.id === '46588dc3-c4d1-4269-b626-90116c8b97a4')
  if (station1) {
    console.log('\n✅ Station_1 found in response:')
    console.log('   Name:', station1.name)
    console.log('   Type:', station1.type)
    console.log('   Status:', station1.is_active ? 'Active' : 'Inactive')
    console.log('   Last Update:', station1.last_update)
    console.log('   Last Data:', station1.lastData ? 'Yes' : 'No')
    if (station1.lastData) {
      console.log('   └─ Value:', station1.lastData.value, station1.lastData.unit)
      console.log('   └─ Temp:', station1.lastData.temperature, '°C')
      console.log('   └─ Humidity:', station1.lastData.humidity, '%')
      console.log('   └─ Time:', station1.lastData.timestamp)
    }
  } else {
    console.log('\n⚠️  Station_1 not found in response')
  }

  // Test summary stats
  console.log('\n\n2️⃣ Testing /api/stats/summary...')
  
  const total = devices.length
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const online = devices.filter(d => {
    const lastUpdate = d.last_update ? new Date(d.last_update) : null
    return d.is_active && lastUpdate && lastUpdate > fiveMinutesAgo
  }).length
  const offline = total - online

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: messagesToday } = await supabase
    .from('sensor_data')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', todayStart.toISOString())

  console.log('📊 Summary Stats:')
  console.log(JSON.stringify({
    total,
    online,
    offline,
    messagesToday: messagesToday || 0,
    timestamp: new Date().toISOString()
  }, null, 2))
}

testAPIResponse().catch(console.error)
