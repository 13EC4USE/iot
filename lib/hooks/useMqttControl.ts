"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useToast } from "@/lib/hooks/useToast"
import { getMqttClient, setConnectionStatusCallback, isMqttConnected } from "@/lib/mqtt/client"

export function useMqttControl() {
  const toast = useToast()
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [mqttConnected, setMqttConnected] = useState(false)

  // Initialize MQTT client and listen for connection status
  useEffect(() => {
    // Initialize connection
    getMqttClient()

    // Set up connection status callback
    setConnectionStatusCallback((connected) => {
      setMqttConnected(connected)
      if (connected) {
        console.log("[useMqttControl] MQTT connected")
      } else {
        console.warn("[useMqttControl] MQTT disconnected")
      }
    })

    // Check initial status
    setMqttConnected(isMqttConnected())

    return () => {
      // Cleanup debounce timers
      debounceTimers.current.forEach((timer) => clearTimeout(timer))
      debounceTimers.current.clear()
    }
  }, [])

  /**
   * Publish MQTT message for device control
   */
  const publishControl = useCallback(
    async (deviceId: string, topic: string, payload: any, options?: { showToast?: boolean }) => {
      // Check MQTT connection
      if (!isMqttConnected()) {
        toast.error("Cannot send command: MQTT Disconnected")
        console.error("[useMqttControl] MQTT not connected")
        return false
      }

      try {
        const message = JSON.stringify(payload)
        
        console.log("[useMqttControl] Publishing:", { topic, payload })

        // Publish via API endpoint (uses server-side MQTT client)
        const response = await fetch("/api/mqtt/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            message,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to publish message")
        }

        const result = await response.json()
        console.log("[useMqttControl] Publish success:", result)

        if (options?.showToast) {
          toast.success("Command sent successfully")
        }

        return true
      } catch (error) {
        console.error("[useMqttControl] Publish error:", error)
        toast.error(`Failed to send command: ${error instanceof Error ? error.message : "Unknown error"}`)
        return false
      }
    },
    [toast]
  )

  /**
   * Toggle Switch (On/Off)
   */
  const toggleSwitch = useCallback(
    async (device: any, newStatus: "on" | "off") => {
      const topic = device.mqtt_topic || `iot/${device.type}/${device.id}`
      const payload = {
        id: device.id,
        status: newStatus,
        timestamp: new Date().toISOString(),
      }

      return await publishControl(device.id, topic, payload, { showToast: false })
    },
    [publishControl]
  )

  /**
   * Set Slider/Dimmer Value (with debounce)
   */
  const setSliderValue = useCallback(
    (device: any, value: number, options?: { immediate?: boolean }) => {
      const topic = device.mqtt_topic || `iot/${device.type}/${device.id}`
      const payload = {
        id: device.id,
        value,
        timestamp: new Date().toISOString(),
      }

      // Clear existing debounce timer for this device
      const existingTimer = debounceTimers.current.get(device.id)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      if (options?.immediate) {
        // Send immediately (on mouse release)
        publishControl(device.id, topic, payload, { showToast: false })
      } else {
        // Debounce: send after 200ms of no changes
        const timer = setTimeout(() => {
          publishControl(device.id, topic, payload, { showToast: false })
          debounceTimers.current.delete(device.id)
        }, 200)

        debounceTimers.current.set(device.id, timer)
      }
    },
    [publishControl]
  )

  /**
   * Set Device Mode
   */
  const setMode = useCallback(
    async (device: any, mode: string) => {
      const topic = `${device.mqtt_topic || `iot/${device.type}/${device.id}`}/mode`
      const payload = {
        id: device.id,
        mode,
        timestamp: new Date().toISOString(),
      }

      return await publishControl(device.id, topic, payload, { showToast: true })
    },
    [publishControl]
  )

  /**
   * Send Custom Command
   */
  const sendCustomCommand = useCallback(
    async (device: any, command: string, data?: any) => {
      const topic = `${device.mqtt_topic || `iot/${device.type}/${device.id}`}/command`
      const payload = {
        id: device.id,
        command,
        data,
        timestamp: new Date().toISOString(),
      }

      return await publishControl(device.id, topic, payload, { showToast: true })
    },
    [publishControl]
  )

  return {
    toggleSwitch,
    setSliderValue,
    setMode,
    sendCustomCommand,
    publishControl,
    mqttConnected,
  }
}
