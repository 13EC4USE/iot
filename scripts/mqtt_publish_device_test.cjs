;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const mqtt = require('mqtt')

    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt'
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined
    const clientId = 'iot-publisher-' + Math.random().toString(36).substring(7)
    const opts = { clientId, reconnectPeriod: 1000, connectTimeout: 30 * 1000 }
    if (username) opts.username = username
    if (password) opts.password = password

    const client = mqtt.connect(broker, opts)

    const topic = 'iot/temp/living-room'
    const payloadObj = { value: 26.3, temperature: 26.3, unit: '°C', timestamp: new Date().toISOString() }
    const payload = JSON.stringify(payloadObj)

    // If USE_INGEST_HTTP=1, send signed HTTP POST to ingest endpoint instead of publishing to broker
    const useHttp = process.env.USE_INGEST_HTTP === '1'
    const ingestUrl = process.env.INGEST_ENDPOINT || 'http://localhost:3000/api/mqtt/ingest'
    const ingestSecret = process.env.MQTT_INGEST_SECRET

    if (useHttp) {
      if (!ingestSecret) {
        console.error('[mqtt-publish-test] MQTT_INGEST_SECRET not set; cannot sign HTTP ingest')
        process.exit(1)
      }
      const fetch = (await import('node-fetch')).default
      const crypto = require('crypto')
      const body = JSON.stringify({ topic, payload: payloadObj })
      const hmac = crypto.createHmac('sha256', ingestSecret)
      hmac.update(body)
      const signature = `sha256=${hmac.digest('hex')}`

      console.log('[mqtt-publish-test] POSTing to ingest endpoint', ingestUrl)
      const res = await fetch(ingestUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ingest-signature': signature }, body })
      const text = await res.text()
      console.log('[mqtt-publish-test] status', res.status)
      console.log('[mqtt-publish-test] body', text)
      process.exit(res.ok ? 0 : 1)
    }

    client.on('connect', () => {
      console.log('[mqtt-publish-test] connected, publishing to', topic)
      client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) console.error('[mqtt-publish-test] publish error:', err)
        else console.log('[mqtt-publish-test] published payload')
        client.end()
        process.exit(0)
      })
    })

    client.on('error', (err) => {
      console.error('[mqtt-publish-test] error:', err)
      client.end()
      process.exit(1)
    })
  } catch (err) {
    console.error('mqtt_publish_device_test error:', err)
    process.exit(1)
  }
})()
