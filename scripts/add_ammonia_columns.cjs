const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAmmoniaColumns() {
  console.log('🔧 Adding ammonia-specific columns to sensor_data...\n')

  // Note: Column addition should be done via SQL in Supabase Dashboard
  // This script updates existing data to populate new fields

  const station1Id = '46588dc3-c4d1-4269-b626-90116c8b97a4'

  // Update existing sensor_data entries to populate ammonia_ppm and station_id
  console.log('1️⃣ Updating existing sensor_data entries...')
  
  const { data: existingData, error: fetchError } = await supabase
    .from('sensor_data')
    .select('id, device_id, value')
    .eq('device_id', station1Id)

  if (fetchError) {
    console.error('❌ Error fetching data:', fetchError.message)
    return
  }

  console.log(`   Found ${existingData.length} entries to update`)

  // Update each entry to set ammonia_ppm = value and station_id = 'Station_1'
  for (const entry of existingData) {
    const { error: updateError } = await supabase
      .from('sensor_data')
      .update({
        ammonia_ppm: entry.value,
        station_id: 'Station_1'
      })
      .eq('id', entry.id)

    if (updateError) {
      console.error(`   ❌ Error updating entry ${entry.id}:`, updateError.message)
    }
  }

  console.log('   ✅ Updated all entries')

  // Verify the update
  console.log('\n2️⃣ Verifying updates...')
  const { data: verifyData, error: verifyError } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('device_id', station1Id)
    .order('timestamp', { ascending: false })
    .limit(3)

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError.message)
    return
  }

  console.log('   Latest 3 entries:')
  verifyData.forEach((entry, i) => {
    console.log(`   ${i + 1}. Timestamp: ${entry.timestamp}`)
    console.log(`      Value: ${entry.value} ${entry.unit}`)
    console.log(`      Ammonia PPM: ${entry.ammonia_ppm || 'null'}`)
    console.log(`      Station ID: ${entry.station_id || 'null'}`)
    console.log(`      Calibrated Ro: ${entry.calibrated_ro || 'null'}`)
    console.log(`      Temp: ${entry.temperature}°C, Humidity: ${entry.humidity}%`)
  })

  console.log('\n✅ Done! Run SQL script in Supabase Dashboard to add columns if needed.')
}

addAmmoniaColumns().catch(console.error)
