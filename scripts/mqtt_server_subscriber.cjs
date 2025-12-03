;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const mqtt = require('mqtt')
    const { createAdminClient } = require('../lib/supabase/admin.js')

    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt'
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined
    const prefix = process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX || 'iot/'
    const clientId = 'iot-server-subscriber-' + Math.random().toString(36).substring(7)

    const opts = { clientId, reconnectPeriod: 1000, connectTimeout: 30 * 1000 }
    if (username) opts.username = username
    if (password) opts.password = password

    console.log('[mqtt-subscriber] connecting to', broker)
    const client = mqtt.connect(broker, opts)
    const supabase = createAdminClient()
    const fetch = (await import('node-fetch')).default
    const crypto = require('crypto')
    const ingestUrl = process.env.INGEST_ENDPOINT || 'http://localhost:3000/api/mqtt/ingest'
    const ingestSecret = process.env.MQTT_INGEST_SECRET

    client.on('connect', () => {
      console.log('[mqtt-subscriber] connected, subscribing to', `${prefix}#`)
      client.subscribe(`${prefix}#`, { qos: 1 }, (err) => {
        if (err) console.error('[mqtt-subscriber] subscribe error', err)
      })
    })

    client.on('message', async (topic, message) => {
      try {
        const messageStr = message.toString()
        let parsed
        try { parsed = JSON.parse(messageStr) } catch { parsed = { value: messageStr } }

        // Find device by exact mqtt_topic match
        const { data: device, error: deviceError } = await supabase.from('devices').select('id,type').eq('mqtt_topic', topic).limit(1).single()
        if (deviceError || !device) {
          console.warn('[mqtt-subscriber] device not found for topic', topic)
          return
        }

        const value = parsed.value ?? parsed.val ?? null
        const temperature = parsed.temperature ?? parsed.temp ?? null
        const humidity = parsed.humidity ?? null
        const unit = parsed.unit ?? (device.type === 'temperature' ? '°C' : device.type === 'humidity' ? '%' : 'units')
        const timestamp = parsed.timestamp ?? new Date().toISOString()

        // Prepare body for ingest endpoint
        const body = {
          topic,
          payload: {
            value: value ?? 0,
            temperature,
            humidity,
            unit,
            timestamp,
          },
        }

        // If ingest secret present, POST signed request to ingest endpoint. Otherwise, fall back to direct DB insert.
        if (ingestSecret) {
          try {
            const raw = JSON.stringify(body)
            const hmac = crypto.createHmac('sha256', ingestSecret)
            hmac.update(raw)
            const signature = `sha256=${hmac.digest('hex')}`

            const res = await fetch(ingestUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-ingest-signature': signature },
              body: raw,
            })

            if (!res.ok) {
              const text = await res.text()
              console.error('[mqtt-subscriber] ingest endpoint error', res.status, text)
            } else {
              console.log('[mqtt-subscriber] forwarded message to ingest for device', device.id)
            }
          } catch (err) {
            console.error('[mqtt-subscriber] failed to POST to ingest endpoint, falling back to DB insert:', err)
            // fall through to DB insert below
            const { error: insertError } = await supabase.from('sensor_data').insert({
              device_id: device.id,
              value: value ?? 0,
              unit,
              temperature,
              humidity,
              timestamp,
            })
            if (insertError) console.error('[mqtt-subscriber] Failed to insert sensor_data:', insertError)
            else console.log('[mqtt-subscriber] Inserted sensor_data for device', device.id)
          }
        } else {
          // No ingest secret configured - insert directly
          const { error: insertError } = await supabase.from('sensor_data').insert({
            device_id: device.id,
            value: value ?? 0,
            unit,
            temperature,
            humidity,
            timestamp,
          })
          if (insertError) console.error('[mqtt-subscriber] Failed to insert sensor_data:', insertError)
          else console.log('[mqtt-subscriber] Inserted sensor_data for device', device.id)
        }
      } catch (err) {
        console.error('[mqtt-subscriber] message handler error:', err)
      }
    })

    client.on('error', (err) => {
      console.error('[mqtt-subscriber] client error:', err)
    })

    // keep process alive
    process.on('SIGINT', () => {
      console.log('[mqtt-subscriber] SIGINT, closing')
      client.end()
      process.exit(0)
    })
  } catch (err) {
    console.error('mqtt_server_subscriber error:', err)
    process.exit(1)
  }
})()
