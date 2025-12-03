;(async () => {
  try {
    // Load env
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const { createAdminClient } = require('../lib/supabase/admin.js')

    const supabase = createAdminClient()

    const tables = ['users', 'devices', 'sensor_data', 'device_settings', 'device_alerts']

    for (const table of tables) {
      const { data, error, count } = await supabase.from(table).select('id', { count: 'exact', head: false })
      if (error) {
        console.error(`Error querying ${table}:`, error.message || error)
      } else {
        // Some Supabase versions return count separately; fall back to data length
        const rowCount = typeof count === 'number' ? count : Array.isArray(data) ? data.length : 'unknown'
        console.log(`${table}: ${rowCount}`)
      }
    }

    process.exit(0)
  } catch (err) {
    console.error('Check counts error:', err)
    process.exit(1)
  }
})()
