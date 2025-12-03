;(async () => {
  try {
    const dotenv = await import('dotenv')
    if (dotenv && typeof dotenv.config === 'function') dotenv.config({ path: '.env.local' })

    const mqtt = require('mqtt')

    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || 'wss://broker.hivemq.com:8884/mqtt'
    const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || undefined
    const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || undefined
    const clientIdPrefix = process.env.NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX || 'iot-test-'
    const clientId = clientIdPrefix + Math.random().toString(36).substring(7)

    console.log('Connecting to MQTT broker', broker)

    const opts = { clientId, reconnectPeriod: 1000, connectTimeout: 30 * 1000 }
    if (username) opts.username = username
    if (password) opts.password = password

    const client = mqtt.connect(broker, opts)

    const testTopic = (process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX || 'iot/') + 'test/connect'
    let received = false

    client.on('connect', () => {
      console.log('[MQTT] connected, subscribing to', testTopic)
      client.subscribe(testTopic, (err) => {
        if (err) {
          console.error('[MQTT] subscribe error:', err)
          client.end()
          process.exit(1)
        }

        // publish a test message
        const payload = JSON.stringify({ ts: Date.now(), msg: 'hello-from-test' })
        client.publish(testTopic, payload, (errPub) => {
          if (errPub) console.error('[MQTT] publish error:', errPub)
          else console.log('[MQTT] published test message to', testTopic)
        })
      })
    })

    client.on('message', (topic, message) => {
      console.log('[MQTT] message received on', topic, message.toString())
      received = true
      client.end()
      process.exit(0)
    })

    client.on('error', (err) => {
      console.error('[MQTT] error:', err)
      client.end()
      process.exit(1)
    })

    // timeout
    setTimeout(() => {
      if (!received) {
        console.error('[MQTT] did not receive test message within timeout')
        client.end()
        process.exit(1)
      }
    }, 8000)
  } catch (err) {
    console.error('mqtt_test error:', err)
    process.exit(1)
  }
})()
