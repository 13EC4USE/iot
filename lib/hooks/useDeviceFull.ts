"use client"

import useSWR from "swr"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => res.json())

// full version 🟦 รวมทุกอย่างใน hook เดียว
export function useDeviceFull(deviceId: string | null, range = "24h") {
  // -------------------------------------------
  // 1) ดึง devices
  // -------------------------------------------
  const devicesKey = "/api/devices"
  const {
    data: devicesResp,
    error: devicesError,
    isLoading: loadingDevices,
    mutate: mutateDevices,
  } = useSWR(devicesKey, fetcher)

  const devices = Array.isArray(devicesResp) ? devicesResp : []

  // -------------------------------------------
  // 2) ดึง device ตัวเดียว
  // -------------------------------------------
  const deviceKey = deviceId ? `/api/devices/${deviceId}` : null
  const {
    data: device,
    isLoading: loadingDevice,
    error: deviceError,
    mutate: mutateDevice,
  } = useSWR(deviceKey, fetcher)

  // -------------------------------------------
  // 3) ดึง sensor data (server)
  // -------------------------------------------
  const dataKey = deviceId
    ? `/api/devices/${deviceId}/data?range=${range}`
    : null

  const {
    data: serverDataResp,
    isLoading: loadingData,
    error: dataError,
    mutate: mutateData,
  } = useSWR(dataKey, fetcher)

  const data = serverDataResp?.data ?? []

  // -------------------------------------------
  // 4) ดึง alerts
  // -------------------------------------------
  const alertsKey = deviceId ? `/api/alerts?deviceId=${deviceId}` : "/api/alerts"

  const {
    data: alertsResp,
    isLoading: loadingAlerts,
    error: alertsError,
    mutate: mutateAlerts,
  } = useSWR(alertsKey, fetcher)

  const alerts = alertsResp?.alerts ?? []

  // -------------------------------------------
  // 🔁 รวม mutate ทั้งหมด → ใช้ใน realtime MQTT
  // -------------------------------------------
  function mutateAll() {
    mutateDevices()
    mutateDevice()
    mutateData()
    mutateAlerts()
  }

  // -------------------------------------------
  // สรุปค่า output ของ hook เดียว
  // -------------------------------------------
  return {
    devices,
    device,
    data,
    alerts,
    loading:
      loadingDevices || loadingDevice || loadingData || loadingAlerts,
    error: devicesError || deviceError || dataError || alertsError,
    mutateAll,
  }
}
