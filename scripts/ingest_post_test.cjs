;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const fetch = (await import('node-fetch')).default
    const crypto = require('crypto')

    const url = process.env.INGEST_TEST_URL || 'http://localhost:3000/api/mqtt/ingest'
    const secret = process.env.MQTT_INGEST_SECRET

    const body = {
      topic: 'iot/temp/living-room',
      payload: { value: 27.1, temperature: 27.1, unit: '°C', timestamp: new Date().toISOString() }
    }

    const raw = JSON.stringify(body)

    if (!secret) {
      console.error('MQTT_INGEST_SECRET not set in .env.local; set it to test HMAC signing')
      process.exit(1)
    }

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(raw)
    const signature = `sha256=${hmac.digest('hex')}`

    console.log('[ingest-post-test] POSTing to', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-signature': signature },
      body: raw,
    })

    const data = await res.text()
    console.log('[ingest-post-test] status', res.status)
    console.log('[ingest-post-test] body', data)
    process.exit(0)
  } catch (err) {
    console.error('ingest_post_test error:', err)
    process.exit(1)
  }
})()
