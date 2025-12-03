import mqtt, { type MqttClient, IClientOptions } from "mqtt"

let client: MqttClient | null = null

export function getMqttClient() {
  if (typeof window === "undefined") return null

  if (client && client.connected) {
    return client
  }

  const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER || "wss://broker.hivemq.com:8884/mqtt"
  const clientIdPrefix = process.env.NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX || "iot-client-"
  const clientId = `${clientIdPrefix}${Math.random().toString(36).substring(7)}`

  const opts: IClientOptions = {
    clientId,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    clean: true,
  }

  const username = process.env.NEXT_PUBLIC_MQTT_USERNAME
  const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD

  if (username) opts.username = username
  if (password) opts.password = password

  client = mqtt.connect(brokerUrl, opts)

  client.on("connect", () => {
    console.log("[MQTT] Connected to broker", brokerUrl)
  })

  client.on("error", (error) => {
    console.error("[MQTT] Connection error:", error)
  })

  client.on("disconnect", () => {
    console.log("[MQTT] Disconnected from broker")
  })

  return client
}

export function subscribeTopic(topic: string, callback: (message: string) => void) {
  const mqttClient = getMqttClient()
  if (!mqttClient) return

  mqttClient.subscribe(topic, (error) => {
    if (error) {
      console.error(`[MQTT] Failed to subscribe to ${topic}:`, error)
    }
  })

  mqttClient.on("message", (receivedTopic, message) => {
    if (receivedTopic === topic) {
      callback(message.toString())
    }
  })
}

export function publishMessage(topic: string, payload: string) {
  const mqttClient = getMqttClient()
  if (!mqttClient) {
    console.error("[MQTT] Client not connected")
    return
  }

  mqttClient.publish(topic, payload, (error) => {
    if (error) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, error)
    } else {
      console.log(`[MQTT] Published to ${topic}`)
    }
  })
}

export function disconnectMqtt() {
  if (client) {
    client.end()
    client = null
  }
}
