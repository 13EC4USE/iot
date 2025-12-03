;(async () => {
  const dotenv = await import('dotenv')
  if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })
  const mqtt = require('mqtt')

  const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt'
  const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined
  const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined
  const clientId = 'iot-pub-' + Math.random().toString(36).substring(7)

  const opts = { clientId, reconnectPeriod: 0 }
  if (username) opts.username = username
  if (password) opts.password = password

  const client = mqtt.connect(broker, opts)
  const topic = 'iot/temp/living-room'
  client.on('connect', () => {
    const payload = JSON.stringify({ value: 23.5, unit: '°C', temperature: 23.5, timestamp: new Date().toISOString() })
    client.publish(topic, payload, {}, (err) => {
      if (err) console.error('publish err', err)
      else console.log('published to', topic)
      client.end()
      process.exit(0)
    })
  })
  client.on('error', (err) => { console.error('mqtt publish error', err); process.exit(1) })
})()
