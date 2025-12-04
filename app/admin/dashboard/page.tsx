"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import useSWR from "swr"
import mqtt from "mqtt/dist/mqtt"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json())

// ----------------------------------------------------
// 🧠 MAIN HOOK: useIoTSystem (FULL REALTIME MODE)
// ----------------------------------------------------
export function useIoTSystem(defaultDeviceId: string | null = null) {
  // -----------------------------
  // 1) Load devices list
  // -----------------------------
  const {
    data: devices,
    error: devicesError,
    isLoading: devicesLoading,
    mutate: mutateDevices,
  } = useSWR("/api/devices", fetcher, { refreshInterval: 5000 })

  // -----------------------------
  // 2) Selected device state
  // -----------------------------
  const [selectedDeviceId, setSelectedDeviceId] =
    useState<string | null>(defaultDeviceId)

  // set default device after load
  useEffect(() => {
    if (!selectedDeviceId && Array.isArray(devices) && devices.length > 0) {
      setSelectedDeviceId(devices[0].id)
    }
  }, [devices, selectedDeviceId])

  // -----------------------------
  // 3) Device detail
  // -----------------------------
  const {
    data: device,
    mutate: mutateDevice,
    isLoading: deviceLoading,
  } = useSWR(
    selectedDeviceId ? `/api/devices/${selectedDeviceId}` : null,
    fetcher
  )

  // -----------------------------
  // 4) Historical Data (DB)
  // -----------------------------
  const {
    data: dbData,
    mutate: mutateDbData,
    isLoading: dbLoading,
  } = useSWR(
    selectedDeviceId
      ? `/api/devices/${selectedDeviceId}/data?range=24h`
      : null,
    fetcher
  )

  const dbRows = Array.isArray(dbData?.data)
    ? dbData.data
    : Array.isArray(dbData)
    ? dbData
    : []

  // -----------------------------
  // 5) Alerts
  // -----------------------------
  const {
    data: alertsData,
    mutate: mutateAlerts,
    isLoading: alertsLoading,
  } = useSWR(
    selectedDeviceId ? `/api/alerts?deviceId=${selectedDeviceId}` : null,
    fetcher
  )

  const alerts = Array.isArray(alertsData?.alerts)
    ? alertsData.alerts
    : []

  // -----------------------------
  // 6) MQTT Realtime
  // -----------------------------
  const [realtimeData, setRealtimeData] = useState<Record<string, any[]>>({})
  const mqttRef = useRef<any>(null)

  useEffect(() => {
    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER
    if (!broker) return

    const client = mqtt.connect(broker, {
      connectTimeout: 4000,
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      clientId: `iot-${Math.random().toString(16).slice(2, 8)}`,
    })

    mqttRef.current = client

    client.on("message", (topic, payload) => {
      let parsed: any = {}
      try {
        parsed = JSON.parse(payload.toString())
      } catch {
        parsed = { value: payload.toString() }
      }

      if (!parsed.device_id) return

      const row = {
        device_id: parsed.device_id,
        value: parsed.value ?? null,
        temperature: parsed.temperature ?? parsed.temp ?? null,
        humidity: parsed.humidity ?? null,
        battery_level: parsed.battery ?? null,
        timestamp: parsed.timestamp ?? new Date().toISOString(),
      }

      setRealtimeData((prev) => {
        const arr = prev[row.device_id] ? [...prev[row.device_id]] : []
        arr.push(row)
        if (arr.length > 500) arr.shift()
        return { ...prev, [row.device_id]: arr }
      })
    })

    return () => {
      try {
        client.end(true)
      } catch {}
    }
  }, [])

  // subscribe per device
  useEffect(() => {
    if (!mqttRef.current || !device?.mqtt_topic) return
    const client = mqttRef.current
    client.subscribe(device.mqtt_topic)
    return () => client.unsubscribe(device.mqtt_topic)
  }, [device])

  // -----------------------------
  // 7) Merge DB + MQTT
  // -----------------------------
  const mergedData =
    selectedDeviceId && realtimeData[selectedDeviceId]
      ? [...dbRows, ...realtimeData[selectedDeviceId]]
      : [...dbRows]

  // -----------------------------
  // 8) Control Device
  // -----------------------------
  const controlDevice = useCallback(
    async (id: string, action: string, value: any) => {
      const res = await fetch(`/api/devices/${id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      })

      return await res.json()
    },
    []
  )

  // -----------------------------
  // 9) Mutate all
  // -----------------------------
  const mutateAll = () => {
    mutateDevices()
    mutateDevice()
    mutateDbData()
    mutateAlerts()
  }

  return {
    // data
    devices: Array.isArray(devices) ? devices : [],
    device: device || null,
    data: mergedData,
    alerts,

    // selection
    selectedDeviceId,
    setSelectedDeviceId,

    // control
    controlDevice,

    // refresh
    mutateAll,

    // loading + errors
    isLoading: devicesLoading || deviceLoading || dbLoading || alertsLoading,
    error: devicesError,
  }
}
