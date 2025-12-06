"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import useSWR from "swr"

type DeviceRow = {
  device_id: string
  value?: any
  temperature?: number | null
  humidity?: number | null
  battery_level?: number | null
  timestamp: string
  // smoothed fields appended later
  smoothed?: Record<string, number | null>
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json())

// ---------- Configuration (tweakable) ----------
const MQTT_OPTIONS = {
  connectTimeout: 4000,
  // we'll set reconnectPeriod when connecting
}
const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30_000
const THROTTLE_MS_PER_DEVICE = 200 // at most 5 messages/sec per device by default
const SMOOTH_WINDOW = 5 // moving average window
// Validation ranges (from your project context; tweak as needed)
const VALID_RANGES: Record<string, { min: number; max: number }> = {
  light: { min: 0, max: 20000 }, // uLux (day ~10000)
  ammonia: { min: 0, max: 2000 }, // ppm (set wide safety)
  temperature: { min: -50, max: 85 }, // °C
  humidity: { min: 0, max: 100 }, // %
}

// ---------- Hook ----------
export function useIoTSystem(defaultDeviceId: string | null = null) {
  // -----------------------------
  // Basic SWR loads
  // -----------------------------
  const {
    data: devices,
    error: devicesError,
    isLoading: devicesLoading,
    mutate: mutateDevices,
  } = useSWR("/api/devices", fetcher, { refreshInterval: 5000 })

  const [selectedDeviceId, setSelectedDeviceId] =
    useState<string | null>(defaultDeviceId)

  useEffect(() => {
    if (!selectedDeviceId && Array.isArray(devices) && devices.length > 0) {
      setSelectedDeviceId(devices[0].id)
    }
  }, [devices, selectedDeviceId])

  const {
    data: device,
    mutate: mutateDevice,
    isLoading: deviceLoading,
  } = useSWR(
    selectedDeviceId ? `/api/devices/${selectedDeviceId}` : null,
    fetcher
  )

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

  const dbRows: DeviceRow[] = Array.isArray(dbData?.data)
    ? dbData.data
    : Array.isArray(dbData)
    ? dbData
    : []

  const {
    data: alertsData,
    mutate: mutateAlerts,
    isLoading: alertsLoading,
  } = useSWR(
    selectedDeviceId ? `/api/alerts?deviceId=${selectedDeviceId}` : null,
    fetcher
  )

  // -----------------------------
  // Realtime data + refs
  // -----------------------------
  const [realtimeData, setRealtimeData] = useState<Record<string, DeviceRow[]>>(
    {}
  )
  const mqttRef = useRef<any>(null)
  const lastMessageTsRef = useRef<Record<string, number>>({})
  const reconnectAttemptsRef = useRef(0)
  const pendingAlertsRef = useRef<any[]>([])
  const throttlesRef = useRef<Record<string, number>>({}) // deviceId -> last processed ts
  const smoothingBuffersRef = useRef<
    Record<string, Record<string, number[]>>
  >({}) // deviceId -> metric -> last N values

  // Exposed mqtt status
  const [mqttStatus, setMqttStatus] = useState<
    "idle" | "connecting" | "connected" | "reconnecting" | "offline" | "error"
  >("idle")

  // Alerts state (merged from server alerts + local)
  const [localAlerts, setLocalAlerts] = useState<any[]>(
    Array.isArray(alertsData?.alerts) ? alertsData.alerts : []
  )

  useEffect(() => {
    // merge server alerts when they change
    if (Array.isArray(alertsData?.alerts)) {
      setLocalAlerts((prev) => {
        // simple merge (dedupe by timestamp+message)
        const seen = new Set(prev.map((a) => `${a.ts}-${a.msg}`))
        const combined = [...prev]
        for (const a of alertsData.alerts) {
          const key = `${a.ts}-${a.msg}`
          if (!seen.has(key)) {
            combined.push(a)
            seen.add(key)
          }
        }
        return combined
      })
    }
  }, [alertsData])

  // ---------- Helper: push alert ----------
  const pushAlert = useCallback((alert: { severity?: string; msg: string }) => {
    const a = { ts: new Date().toISOString(), severity: alert.severity || "warn", msg: alert.msg }
    pendingAlertsRef.current.push(a)
    setLocalAlerts((prev) => [a, ...prev])
  }, [])

  // ---------- Helper: validate ----------
  function validateRow(row: DeviceRow) {
    // check known fields
    const anomalies: string[] = []
    const check = (k: string, v: any) => {
      if (v == null || isNaN(Number(v))) return
      const key = k.toString()
      if (VALID_RANGES[key]) {
        const { min, max } = VALID_RANGES[key]
        if (Number(v) < min || Number(v) > max) {
          anomalies.push(`${key} out-of-range (${v})`)
        }
      }
    }
    check("temperature", row.temperature)
    check("humidity", row.humidity)
    check("light", row.value) // if you send light as value
    check("ammonia", (row as any).ammonia ?? (row as any).nh3)
    return anomalies
  }

  // ---------- Helper: smoothing (moving average) ----------
  function appendAndSmooth(deviceId: string, row: DeviceRow) {
    if (!smoothingBuffersRef.current[deviceId]) {
      smoothingBuffersRef.current[deviceId] = {}
    }
    const buf = smoothingBuffersRef.current[deviceId]
    const metrics = ["temperature", "humidity", "battery_level", "value", "ammonia", "light"]
    const smoothed: Record<string, number | null> = {}
    metrics.forEach((m) => {
      const val = (row as any)[m]
      if (val == null || isNaN(Number(val))) {
        smoothed[m] = null
        return
      }
      if (!buf[m]) buf[m] = []
      buf[m].push(Number(val))
      if (buf[m].length > SMOOTH_WINDOW) buf[m].shift()
      const sum = buf[m].reduce((s, x) => s + x, 0)
      smoothed[m] = sum / buf[m].length
    })
    row.smoothed = smoothed
  }

  // ---------- MQTT setup (single effect) ----------
  useEffect(() => {
    let cancelled = false
    setMqttStatus("connecting")

    const setupMQTT = async () => {
      try {
        const mqttModule = await import("mqtt")
        const connect = mqttModule.connect ?? mqttModule.default?.connect ?? mqttModule // fallback
        // compute reconnectPeriod with backoff
        const reconnectPeriod = 2000 // library will manage reconnect; we track attempts too
        const broker = process.env.NEXT_PUBLIC_MQTT_BROKER
        if (!broker) {
          setMqttStatus("offline")
          pushAlert({ severity: "error", msg: "MQTT broker not configured" })
          return
        }

        // create client
        const client = connect(broker, {
          ...MQTT_OPTIONS,
          reconnectPeriod,
          username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
          password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
          clientId: `iot-${Math.random().toString(16).slice(2, 8)}`,
        })

        mqttRef.current = client
        setMqttStatus("connecting")

        client.on("connect", () => {
          reconnectAttemptsRef.current = 0
          setMqttStatus("connected")
        })

        client.on("reconnect", () => {
          reconnectAttemptsRef.current++
          setMqttStatus("reconnecting")
        })

        client.on("close", () => {
          setMqttStatus("offline")
        })

        client.on("offline", () => {
          setMqttStatus("offline")
        })

        client.on("error", (err: any) => {
          setMqttStatus("error")
          pushAlert({ severity: "error", msg: `MQTT error: ${err?.message ?? err}` })
        })

        client.on("message", (topic: string, payload: Buffer) => {
          try {
            const now = Date.now()
            // rate-limit per device/topic
            let parsed: any = {}
            try {
              parsed = JSON.parse(payload.toString())
            } catch {
              parsed = { value: payload.toString() }
            }
            const deviceId = parsed.device_id ?? parsed.device ?? topic
            const lastTs = throttlesRef.current[deviceId] ?? 0
            if (now - lastTs < THROTTLE_MS_PER_DEVICE) {
              // drop due to throttle
              return
            }
            throttlesRef.current[deviceId] = now

            // build row
            const row: DeviceRow = {
              device_id: deviceId,
              value: parsed.value ?? null,
              temperature: parsed.temperature ?? parsed.temp ?? null,
              humidity: parsed.humidity ?? null,
              battery_level: parsed.battery ?? null,
              timestamp: parsed.timestamp ?? new Date().toISOString(),
            }

            // validation -> push alert if anomaly
            const anomalies = validateRow(row)
            if (anomalies.length > 0) {
              pushAlert({
                severity: "warn",
                msg: `Device ${deviceId} anomalies: ${anomalies.join("; ")}`,
              })
            }

            // smoothing
            appendAndSmooth(deviceId, row)

            // append to realtimeData
            setRealtimeData((prev) => {
              const arr = prev[deviceId] ? [...prev[deviceId]] : []
              arr.push(row)
              if (arr.length > 500) arr.shift()
              return { ...prev, [deviceId]: arr }
            })
          } catch (e) {
            // catch per-message errors so handler doesn't crash
            pushAlert({ severity: "error", msg: `MQTT message handler error: ${String(e)}` })
          }
        })
      } catch (e: any) {
        setMqttStatus("error")
        pushAlert({ severity: "error", msg: `MQTT load/connect failed: ${e?.message ?? e}` })
      }
    }

    setupMQTT()

    return () => {
      cancelled = true
      try {
        mqttRef.current?.end(true)
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on client

  // ---------- subscribe/unsubscribe when device changes ----------
  useEffect(() => {
    const client = mqttRef.current
    if (!client || !device?.mqtt_topic) return
    try {
      client.subscribe(device.mqtt_topic)
    } catch (e) {
      pushAlert({ severity: "error", msg: `Failed to subscribe ${device.mqtt_topic}` })
    }
    return () => {
      try {
        client.unsubscribe(device.mqtt_topic)
      } catch {}
    }
  }, [device, pushAlert])

  // -----------------------------
  // Merge DB + realtime
  // -----------------------------
  const mergedData =
    selectedDeviceId && realtimeData[selectedDeviceId]
      ? [...dbRows, ...realtimeData[selectedDeviceId]]
      : [...dbRows]

  // -----------------------------
  // Control Device
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

  const mutateAll = () => {
    mutateDevices()
    mutateDevice()
    mutateDbData()
    mutateAlerts()
  }

  // provide smoothed snapshot per device
  const smoothedSnapshot: Record<string, Record<string, number | null>> = {}
  Object.entries(smoothingBuffersRef.current).forEach(([did, metrics]) => {
    smoothedSnapshot[did] = {}
    Object.entries(metrics).forEach(([m, arr]) => {
      if (!arr || arr.length === 0) {
        smoothedSnapshot[did][m] = null
      } else {
        const sum = arr.reduce((s, v) => s + v, 0)
        smoothedSnapshot[did][m] = sum / arr.length
      }
    })
  })

  return {
    // data
    devices: Array.isArray(devices) ? devices : [],
    device: device || null,
    data: mergedData,
    realtime: realtimeData,
    smoothed: smoothedSnapshot,
    alerts: localAlerts,

    // selection
    selectedDeviceId,
    setSelectedDeviceId,

    // control
    controlDevice,

    // refresh
    mutateAll,

    // status
    mqttStatus,
    isLoading: devicesLoading || deviceLoading || dbLoading || alertsLoading,
    error: devicesError,
  }
}
