import mqtt, { type MqttClient, IClientOptions } from "mqtt"

let client: MqttClient | null = null
let isConnected = false

// Connection status callback (for UI updates)
let connectionStatusCallback: ((connected: boolean) => void) | null = null

export function setConnectionStatusCallback(callback: (connected: boolean) => void) {
  connectionStatusCallback = callback
}

export function isMqttConnected(): boolean {
  return isConnected && client !== null && client.connected
}

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
    isConnected = true
    if (connectionStatusCallback) {
      connectionStatusCallback(true)
    }
  })

  client.on("error", (error) => {
    console.error("[MQTT] Connection error:", error)
    isConnected = false
    if (connectionStatusCallback) {
      connectionStatusCallback(false)
    }
  })

  client.on("disconnect", () => {
    console.log("[MQTT] Disconnected from broker")
    isConnected = false
    if (connectionStatusCallback) {
      connectionStatusCallback(false)
    }
  })

  client.on("close", () => {
    console.log("[MQTT] Connection closed")
    isConnected = false
    if (connectionStatusCallback) {
      connectionStatusCallback(false)
    }
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

export function publishMessage(topic: string, payload: string): Promise<boolean> {
  return new Promise((resolve) => {
    const mqttClient = getMqttClient()
    if (!mqttClient || !isConnected) {
      console.error("[MQTT] Client not connected")
      resolve(false)
      return
    }

    mqttClient.publish(topic, payload, (error) => {
      if (error) {
        console.error(`[MQTT] Failed to publish to ${topic}:`, error)
        resolve(false)
      } else {
        console.log(`[MQTT] Published to ${topic}:`, payload)
        resolve(true)
      }
    })
  })
}

export function disconnectMqtt() {
  if (client) {
    client.end()
    client = null
    isConnected = false
  }
}
