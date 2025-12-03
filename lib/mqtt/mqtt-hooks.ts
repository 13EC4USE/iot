"use client"

import { useEffect, useRef, useState } from "react"
import type { MqttClient } from "mqtt"
import { createMqttClient } from "./mqtt-service"

interface MqttSubscriptionOptions {
  topic: string
  qos?: 0 | 1 | 2
}

export function useMqttSubscription(topic: string, callback?: (message: string) => void) {
  const [data, setData] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<MqttClient | null>(null)

  useEffect(() => {
    const setupMqtt = async () => {
      try {
        const client = await createMqttClient()
        clientRef.current = client

        client.on("connect", () => {
          console.log("[v0] MQTT connected")
          setIsConnected(true)
          client.subscribe(topic, { qos: 1 })
        })

        client.on("message", (receivedTopic: string, message: Buffer) => {
          if (receivedTopic === topic) {
            const messageStr = message.toString()
            setData(messageStr)
            callback?.(messageStr)
            // Send payload to server ingest endpoint so server-side can persist to DB
            try {
              const parsed = (() => {
                try { return JSON.parse(messageStr) } catch { return messageStr }
              })()

              fetch('/api/mqtt/ingest/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: receivedTopic, payload: parsed }),
              }).catch((e) => console.error('[v0] Failed to POST mqtt ingest:', e))
            } catch (e) {
              console.error('[v0] Error preparing mqtt ingest request:', e)
            }
          }
        })

        client.on("disconnect", () => {
          console.log("[v0] MQTT disconnected")
          setIsConnected(false)
        })

        client.on("error", (error) => {
          console.error("[v0] MQTT error:", error)
        })
      } catch (error) {
        console.error("[v0] Failed to setup MQTT:", error)
      }
    }

    setupMqtt()

    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe(topic)
      }
    }
  }, [topic, callback])

  const publish = async (message: string) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish(topic, message, { qos: 1 })
    }
  }

  return {
    data,
    isConnected,
    publish,
  }
}

export function useMqttPublish() {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<MqttClient | null>(null)

  useEffect(() => {
    const setupMqtt = async () => {
      try {
        const client = await createMqttClient()
        clientRef.current = client

        client.on("connect", () => {
          setIsConnected(true)
        })

        client.on("disconnect", () => {
          setIsConnected(false)
        })
      } catch (error) {
        console.error("[v0] Failed to setup MQTT:", error)
      }
    }

    setupMqtt()

    return () => {
      if (clientRef.current?.connected) {
        clientRef.current.end()
      }
    }
  }, [])

  const publish = async (topic: string, message: string | object) => {
    if (!clientRef.current?.connected) {
      console.error("[v0] MQTT not connected")
      return false
    }

    try {
      const payload = typeof message === "string" ? message : JSON.stringify(message)
      clientRef.current.publish(topic, payload, { qos: 1 })
      return true
    } catch (error) {
      console.error("[v0] Publish error:", error)
      return false
    }
  }

  return {
    publish,
    isConnected,
  }
}
