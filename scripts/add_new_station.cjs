const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addNewStation(stationNumber, location = null) {
  console.log(`\n🔧 Adding Station ${stationNumber}...\n`)

  const stationId = `Station_${stationNumber}`
  
  // Get admin user
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)

  if (userError || !users || users.length === 0) {
    console.error('❌ No users found')
    return
  }

  const userId = users[0].id
  console.log(`Using user: ${users[0].email}`)

  // Check if station already exists
  const { data: existing } = await supabase
    .from('devices')
    .select('id, name')
    .eq('mac_address', `ESP32-${stationId}`)
    .single()

  if (existing) {
    console.log(`⚠️  ${stationId} already exists: ${existing.name}`)
    console.log(`   UUID: ${existing.id}`)
    return existing
  }

  // Create new station
  const { data: newDevice, error: insertError } = await supabase
    .from('devices')
    .insert({
      user_id: userId,
      name: `${stationId} - Ammonia Sensor`,
      type: 'ammonia',
      location: location || `Location ${stationNumber}`,
      mac_address: `ESP32-${stationId}`,
      mqtt_topic: `iot/${stationId}/ammonia`,
      is_active: true,
      power: true,
      battery_level: 100,
      signal_strength: 85,
      last_update: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) {
    console.error('❌ Error creating station:', insertError.message)
    return
  }

  console.log(`✅ ${stationId} created successfully!`)
  console.log(`   UUID: ${newDevice.id}`)
  console.log(`   Name: ${newDevice.name}`)
  console.log(`   Location: ${newDevice.location}`)
  console.log(`   MQTT Topic: ${newDevice.mqtt_topic}`)

  console.log(`\n📝 Add to Pi iot_config.json:`)
  console.log(`───────────────────────────────────────`)
  console.log(`"${stationId}": {`)
  console.log(`  "device_id": "${stationId}",`)
  console.log(`  "broker": "192.168.1.142",`)
  console.log(`  "port": 1883,`)
  console.log(`  "topic_prefix": "iot/",`)
  console.log(`  "enabled": true,`)
  console.log(`  "uuid": "${newDevice.id}",`)
  console.log(`  "last_updated": "${new Date().toISOString()}"`)
  console.log(`}`)
  console.log(`───────────────────────────────────────`)

  console.log(`\n⚡ ESP32 Code (mq_137_deepsleepdebug_pi_local.ino):`)
  console.log(`───────────────────────────────────────`)
  console.log(`const char* DEVICE_ID = "${stationId}";`)
  console.log(`───────────────────────────────────────`)

  console.log(`\n🧪 Test MQTT Message:`)
  console.log(`───────────────────────────────────────`)
  console.log(`mosquitto_pub -h 192.168.1.142 -t "iot/${stationId}/ammonia" -m '{"id":"${stationId}","ammonia":15.5,"temperature":28,"humidity":65,"calibratedRo":10.2,"timestamp":"${new Date().toISOString()}"}'`)
  console.log(`───────────────────────────────────────`)

  return newDevice
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: node add_new_station.cjs <station_number> [location]')
    console.log('Example: node add_new_station.cjs 2 "Farm Area A"')
    console.log('\nOr edit this file and uncomment examples below.')
    
    // Examples (uncomment to use):
    // await addNewStation(2, 'Farm Area A')
    // await addNewStation(3, 'Greenhouse Section B')
    // await addNewStation(4, 'Storage Room')
    
    // Bulk add stations 2-5:
    // for (let i = 2; i <= 5; i++) {
    //   await addNewStation(i, `Section ${String.fromCharCode(64 + i)}`)
    //   await new Promise(r => setTimeout(r, 500))
    // }
    
    return
  }

  const stationNumber = parseInt(args[0])
  const location = args[1] || null

  if (isNaN(stationNumber)) {
    console.error('❌ Station number must be a number')
    return
  }

  await addNewStation(stationNumber, location)
}

main().catch(console.error)
