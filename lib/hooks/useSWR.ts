"use client"

import useSWR from "swr"

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => res.json())

// ---------------------------------------------
// 🔹 1) ดึงอุปกรณ์ทั้งหมด
// ---------------------------------------------
export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR("/api/devices", fetcher)

  return {
    devices: data ?? [],    // (สำคัญ!) ป้องกัน filter error
    error,
    isLoading,
    mutate,
  }
}

// ---------------------------------------------
// 🔹 2) ดึง device ตัวเดียว
// ---------------------------------------------
export function useDevice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/devices/${id}` : null,
    fetcher
  )

  return {
    device: data ?? null,
    error,
    isLoading,
    mutate,
  }
}

// ---------------------------------------------
// 🔹 3) ดึง sensor data ของ device
// ---------------------------------------------
export function useDeviceData(deviceId: string | null, range = "24h") {
  const { data, error, isLoading, mutate } = useSWR(
    deviceId ? `/api/devices/${deviceId}/data?range=${range}` : null,
    fetcher
  )

  return {
    data: data?.data ?? [],   // API ใหม่ส่ง { data: [...] }
    meta: data ?? null,       // ถ้าต้องใช้ range, count
    error,
    isLoading,
    mutate,
  }
}

// ---------------------------------------------
// 🔹 4) ดึง alerts
// ---------------------------------------------
export function useAlerts(deviceId?: string) {
  const query = deviceId ? `?deviceId=${deviceId}` : ""

  const { data, error, isLoading, mutate } = useSWR(
    `/api/alerts${query}`,
    fetcher
  )

  return {
    alerts: data?.alerts ?? [],   // ดึงเฉพาะ array
    count: data?.count ?? 0,
    error,
    isLoading,
    mutate,
  }
}
