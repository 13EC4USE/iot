;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const mqtt = require('mqtt')
    const { createAdminClient } = require('../lib/supabase/admin.js')
    const supabase = createAdminClient()

    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt'
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined
    const clientId = (process.env.NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX || 'iot-listener-') + Math.random().toString(36).substring(7)

    const opts = { clientId, reconnectPeriod: 1000, connectTimeout: 30 * 1000 }
    if (username) opts.username = username
    if (password) opts.password = password

    console.log('[MQTT Listener] connecting to', broker)
    const client = mqtt.connect(broker, opts)

    const topicPrefix = process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX || 'iot/'
    const subscribeTopic = topicPrefix + '#'

    client.on('connect', () => {
      console.log('[MQTT Listener] connected, subscribing to', subscribeTopic)
      client.subscribe(subscribeTopic, (err) => {
        if (err) console.error('[MQTT Listener] subscribe error', err)
      })
    })

    client.on('message', async (topic, message) => {
      const payloadStr = message.toString()
      console.log('[MQTT Listener] message', topic, payloadStr)
      let payload = null
      try {
        payload = JSON.parse(payloadStr)
      } catch (e) {
        // if not JSON, try to parse as number
        const num = Number(payloadStr)
        if (!Number.isNaN(num)) payload = { value: num }
        else payload = { value: payloadStr }
      }

      try {
        // find device by mqtt_topic
        const { data: device, error: devErr } = await supabase.from('devices').select('id,type').eq('mqtt_topic', topic).single()
        if (devErr || !device) {
          console.warn('[MQTT Listener] no device found for topic', topic)
          return
        }

        const record = {
          device_id: device.id,
          value: typeof payload.value === 'number' ? payload.value : null,
          unit: payload.unit || (device.type === 'temperature' ? '°C' : device.type === 'humidity' ? '%' : undefined),
          temperature: payload.temperature ?? (device.type === 'temperature' ? payload.value ?? null : null),
          humidity: payload.humidity ?? (device.type === 'humidity' ? payload.value ?? null : null),
          timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
        }

        const { error: insertErr } = await supabase.from('sensor_data').insert(record)
        if (insertErr) console.error('[MQTT Listener] failed inserting sensor_data:', insertErr.message || insertErr)
        else console.log('[MQTT Listener] inserted sensor_data for device', device.id)
      } catch (err) {
        console.error('[MQTT Listener] processing error:', err)
      }
    })

    client.on('error', (err) => {
      console.error('[MQTT Listener] error', err)
    })

    // keep process running
  } catch (err) {
    console.error('mqtt_listener error:', err)
    process.exit(1)
  }
})()
