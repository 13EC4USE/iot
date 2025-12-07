"use client"

import useSWR from "swr"
import { shouldMakeRequest } from "./useServiceStatus"

// Optimized fetcher with cache support
const fetcher = (url: string) => {
  // Check if service is active before making requests
  if (!shouldMakeRequest()) {
    return new Promise(() => {}) // Never resolves - prevents requests
  }
  return fetch(url, { cache: "no-store" }).then((res) => res.json())
}

// Shared SWR config for optimal performance and minimal server cost
const swrConfig = {
  revalidateOnFocus: false,    // Don't refresh when tab regains focus
  revalidateOnReconnect: false, // Don't refresh when connection restored - save costs
  dedupingInterval: 120000,    // Share cache for 2 minutes - prevent duplicate requests
  focusThrottleInterval: 600000, // Throttle focus revalidation to 10 minutes
  errorRetryCount: 2,
  errorRetryInterval: 30000,
}

// ---------------------------------------------
// 🔹 1) ดึงอุปกรณ์ทั้งหมด
// ---------------------------------------------
export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR("/api/devices", fetcher, {
    ...swrConfig,
    refreshInterval: 600000, // 10 minutes - minimal API calls
  })

  return {
    devices: data ?? [],
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
    fetcher,
    swrConfig
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
    fetcher,
    {
      ...swrConfig,
      refreshInterval: 300000, // 5 minutes - balance between freshness and cost
    }
  )

  return {
    data: data?.data ?? [],
    meta: data ?? null,
    error,
    isLoading,
    mutate,
  }
}

// ---------------------------------------------
// 🔹 4) ดึง device settings
// ---------------------------------------------
export function useDeviceSettings(deviceId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    deviceId ? `/api/devices/${deviceId}/settings` : null,
    fetcher,
    {
      ...swrConfig,
      refreshInterval: 600000, // 10 minutes - rarely changes
    }
  )

  return {
    settings: data ?? null,
    error,
    isLoading,
    mutate,
  }
}

// ---------------------------------------------
// 🔹 5) ดึง alerts
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
