const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function createAlert(deviceId) {
  console.log('Creating test alert for device:', deviceId)

  const { data: alert, error } = await supabase
    .from('device_alerts')
    .insert({
      device_id: deviceId,
      type: 'threshold_exceeded',
      severity: 'warning',
      message: 'NH3 เกินค่า 25 ppm ในช่วง 10:30 น.',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('✅ Alert created:', alert.id)
}

// Default to Station_1 UUID unless provided
const deviceId = process.argv[2] || '46588dc3-c4d1-4269-b626-90116c8b97a4'
createAlert(deviceId).catch(console.error)
