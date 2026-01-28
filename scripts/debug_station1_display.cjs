const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStation1Data() {
  console.log('🔍 Debugging Station_1 Data Display\n')

  const station1Id = '46588dc3-c4d1-4269-b626-90116c8b97a4'

  // 1. Get device info
  console.log('1️⃣ Device Info:')
  const { data: device } = await supabase
    .from('devices')
    .select('*')
    .eq('id', station1Id)
    .single()

  console.log('   Name:', device.name)
  console.log('   Type:', device.type)
  console.log('   Location:', device.location || 'null')
  console.log('   Is Active:', device.is_active)
  console.log('   Last Update:', device.last_update)

  // 2. Get latest sensor data
  console.log('\n2️⃣ Latest Sensor Data:')
  const { data: latestData, error: latestError } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('device_id', station1Id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (latestError) {
    console.error('   ❌ Error:', latestError.message)
  } else {
    console.log('   Value:', latestData.value, latestData.unit)
    console.log('   Temperature:', latestData.temperature)
    console.log('   Humidity:', latestData.humidity)
    console.log('   Timestamp:', latestData.timestamp)
  }

  // 3. Simulate API query
  console.log('\n3️⃣ Simulating /api/devices/recent query:')
  
  const { data: deviceQuery } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      type,
      location,
      is_active,
      last_update,
      battery_level,
      signal_strength
    `)
    .eq('id', station1Id)
    .single()

  const { data: sensorQuery } = await supabase
    .from('sensor_data')
    .select('value, unit, temperature, humidity, timestamp')
    .eq('device_id', station1Id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  const result = {
    ...deviceQuery,
    lastData: sensorQuery || null
  }

  console.log('\n📦 API Response Format:')
  console.log(JSON.stringify(result, null, 2))

  // 4. Check if data would display
  console.log('\n4️⃣ Display Check:')
  console.log('   lastData exists?', result.lastData ? '✅ Yes' : '❌ No')
  if (result.lastData) {
    console.log('   Temperature not null?', result.lastData.temperature !== null ? '✅ Yes' : '❌ No')
    console.log('   Humidity not null?', result.lastData.humidity !== null ? '✅ Yes' : '❌ No')
    console.log('   Value not null?', result.lastData.value !== null ? '✅ Yes' : '❌ No')
    
    console.log('\n   Display would show:')
    if (result.lastData.temperature !== null) {
      console.log('   🌡️', result.lastData.temperature, '°C')
    }
    if (result.lastData.humidity !== null) {
      console.log('   💧', result.lastData.humidity, '%')
    }
    if (result.lastData.value !== null) {
      console.log('   📊', result.lastData.value, result.lastData.unit)
    }
  }
}

debugStation1Data().catch(console.error)
