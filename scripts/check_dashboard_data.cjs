const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDashboardData() {
  console.log('📊 Checking Dashboard Data...\n')

  // 1. Check devices table
  console.log('1️⃣ Devices Table:')
  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('id, name, type, is_active, last_update')
    .order('name')

  if (devicesError) {
    console.error('❌ Error:', devicesError.message)
  } else {
    console.log(`   Total devices: ${devices.length}`)
    devices.forEach(d => {
      console.log(`   - ${d.name} (${d.type}): ${d.is_active ? '🟢 Active' : '🔴 Inactive'}`)
      console.log(`     ID: ${d.id}`)
      console.log(`     Last update: ${d.last_update || 'Never'}`)
    })
  }

  // 2. Check sensor_data for Station_1
  console.log('\n2️⃣ Sensor Data for Station_1:')
  const station1Id = '46588dc3-c4d1-4269-b626-90116c8b97a4'
  
  const { data: sensorData, error: sensorError, count } = await supabase
    .from('sensor_data')
    .select('*', { count: 'exact' })
    .eq('device_id', station1Id)
    .order('timestamp', { ascending: false })
    .limit(10)

  if (sensorError) {
    console.error('❌ Error:', sensorError.message)
  } else {
    console.log(`   Total entries: ${count}`)
    if (sensorData && sensorData.length > 0) {
      console.log('   Latest 10 entries:')
      sensorData.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.timestamp}`)
        console.log(`      Value: ${d.value} ${d.unit || ''}`)
        console.log(`      Temp: ${d.temperature}°C, Humidity: ${d.humidity}%`)
      })
    } else {
      console.log('   ⚠️  No sensor data found!')
    }
  }

  // 3. Test API endpoint logic (simulate what dashboard does)
  console.log('\n3️⃣ Testing Dashboard API Logic:')
  
  // Get devices with last_data join
  const { data: devicesWithData, error: joinError } = await supabase
    .from('devices')
    .select(`
      id,
      name,
      type,
      location,
      is_active,
      last_update,
      battery_level,
      signal_strength,
      last_data:sensor_data(value, unit, temperature, humidity, timestamp)
    `)
    .order('last_update', { ascending: false, nullsFirst: false })
    .limit(5)

  if (joinError) {
    console.error('❌ Join error:', joinError.message)
  } else {
    console.log(`   Found ${devicesWithData.length} devices with data:`)
    devicesWithData.forEach(d => {
      console.log(`   - ${d.name}:`)
      console.log(`     Last data: ${d.last_data?.[0] ? 'Found' : 'None'}`)
      if (d.last_data?.[0]) {
        const data = d.last_data[0]
        console.log(`     Value: ${data.value} ${data.unit || ''}`)
        console.log(`     Temp: ${data.temperature}°C, Humidity: ${data.humidity}%`)
        console.log(`     Time: ${data.timestamp}`)
      }
    })
  }

  // 4. Check summary stats
  console.log('\n4️⃣ Summary Stats:')
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const onlineDevices = devices?.filter(d => {
    const lastUpdate = d.last_update ? new Date(d.last_update) : null
    return d.is_active && lastUpdate && lastUpdate > fiveMinutesAgo
  })

  console.log(`   Total devices: ${devices?.length || 0}`)
  console.log(`   Online (last 5min): ${onlineDevices?.length || 0}`)
  console.log(`   Offline: ${(devices?.length || 0) - (onlineDevices?.length || 0)}`)

  // Messages today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const { count: messagesCount, error: msgError } = await supabase
    .from('sensor_data')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', todayStart.toISOString())

  if (!msgError) {
    console.log(`   Messages today: ${messagesCount || 0}`)
  }
}

checkDashboardData().catch(console.error)
