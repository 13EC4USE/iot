const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixStation1() {
  const station1Id = '46588dc3-c4d1-4269-b626-90116c8b97a4'
  
  console.log('🔧 Fixing Station_1 device...\n')

  // 1. Update last_update to current time
  console.log('1️⃣ Updating last_update timestamp...')
  const { data: updated, error: updateError } = await supabase
    .from('devices')
    .update({ last_update: new Date().toISOString() })
    .eq('id', station1Id)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error:', updateError.message)
  } else {
    console.log('✅ Updated last_update to:', updated.last_update)
  }

  // 2. Get latest sensor data
  console.log('\n2️⃣ Latest sensor data:')
  const { data: latest, error: latestError } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('device_id', station1Id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (latestError) {
    console.error('❌ Error:', latestError.message)
  } else {
    console.log('✅ Latest reading:')
    console.log(`   Value: ${latest.value} ${latest.unit || 'ppm'}`)
    console.log(`   Temp: ${latest.temperature}°C, Humidity: ${latest.humidity}%`)
    console.log(`   Time: ${latest.timestamp}`)
  }

  // 3. Check if device is now online
  console.log('\n3️⃣ Checking online status:')
  const { data: device } = await supabase
    .from('devices')
    .select('is_active, last_update')
    .eq('id', station1Id)
    .single()

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const lastUpdate = device.last_update ? new Date(device.last_update) : null
  const isOnline = device.is_active && lastUpdate && lastUpdate > fiveMinutesAgo

  console.log(`   Status: ${isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`)
  console.log(`   Last update: ${device.last_update}`)
  console.log(`   5min threshold: ${fiveMinutesAgo.toISOString()}`)
}

fixStation1().catch(console.error)
