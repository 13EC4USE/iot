// lib/hooks/useIoTSystem.ts
"use client"

import useSWR from "swr"
import { useEffect, useMemo, useState } from "react"
import mqtt from "mqtt/dist/mqtt"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useIoTSystem(defaultDeviceId?: string | null) {
  // devices list
  const { data: devicesRaw, error: devicesError, mutate: mutateDevices } = useSWR("/api/devices", fetcher)
  const devices = Array.isArray(devicesRaw) ? devicesRaw : []

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(defaultDeviceId ?? null)

  // device metadata + server-side historical data + alerts (via SWR)
  const { data: deviceServer, mutate: mutateDevice } = useSWR(selectedDeviceId ? `/api/devices/${selectedDeviceId}` : null, fetcher)
  const { data: deviceDataServer, mutate: mutateDeviceData } = useSWR(selectedDeviceId ? `/api/devices/${selectedDeviceId}/data?range=24h` : null, fetcher)
  const { data: alertsResp, mutate: mutateAlerts } = useSWR(selectedDeviceId ? `/api/alerts?deviceId=${selectedDeviceId}` : null, fetcher)

  const alerts = alertsResp?.alerts ?? []

  // local MQTT state storage
  const [mqttClient, setMqttClient] = useState<any>(null)
  const [localDeviceData, setLocalDeviceData] = useState<Record<string, any[]>>({})

  // setup a single mqtt client and subscribe to topics for devices
  useEffect(() => {
    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER
    if (!broker) return

    const client = mqtt.connect(broker, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      connectTimeout: 4000,
      clientId: `iot-web-${Math.random().toString(16).slice(2, 8)}`,
    })

    client.on("connect", () => {
      devices.forEach((d: any) => {
        if (d.mqtt_topic) client.subscribe(d.mqtt_topic)
      })
    })

    client.on("message", (topic: string, payload: Buffer) => {
      let parsed: any = null
      try { parsed = JSON.parse(payload.toString()) } catch { parsed = { value: parseFloat(payload.toString()) || payload.toString() } }

      // find device
      const device = devices.find((d: any) => d.mqtt_topic === topic) || devices.find((d: any) => topic.includes(String(d.id)))
      if (!device) return

      const row = {
        device_id: device.id,
        temperature: parsed.temperature ?? parsed.temp ?? null,
        humidity: parsed.humidity ?? null,
        value: parsed.value ?? null,
        battery_level: parsed.battery ?? parsed.battery_level ?? null,
        timestamp: parsed.timestamp ?? new Date().toISOString(),
      }

      // append local
      setLocalDeviceData((prev) => {
        const arr = prev[device.id] ? [...prev[device.id]] : []
        arr.push(row)
        if (arr.length > 500) arr.splice(0, arr.length - 500)
        return { ...prev, [device.id]: arr }
      })

      // persist to server (best-effort)
      fetch(`/api/devices/${device.id}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      }).then(() => {
        // refresh server data & alerts for this device
        mutateDeviceData()
        mutateAlerts()
        mutateDevices()
      }).catch(() => {/* swallow */})
    })

    setMqttClient(client)
    return () => {
      try { client.end(true) } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices.map?.((d:any) => d.mqtt_topic).join?.(",")])

  // merged data for selected device (server + local)
  const mergedData = useMemo(() => {
    const server = Array.isArray(deviceDataServer) ? deviceDataServer : []
    const local = selectedDeviceId ? (localDeviceData[selectedDeviceId] ?? []) : []
    const merged = [...server, ...local].sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    return merged.slice(-500)
  }, [deviceDataServer, localDeviceData, selectedDeviceId])

  // quick control function
  const controlDevice = async (deviceId: string, action: string, value: any) => {
    const res = await fetch(`/api/devices/${deviceId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, value }),
    })
    if (!res.ok) throw new Error("Control failed")
    // refresh
    mutateDevices()
    mutateDevice()
    return res.json()
  }

  // set default device when devices array becomes available
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) setSelectedDeviceId(devices[0].id)
  }, [devices, selectedDeviceId])

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    device: deviceServer ?? null,
    data: mergedData,
    alerts,
    controlDevice,
    mutateAll: () => { mutateDevices(); mutateDevice(); mutateDeviceData(); mutateAlerts() },
    isLoading: !devices,
    error: devicesError,
  }
}
