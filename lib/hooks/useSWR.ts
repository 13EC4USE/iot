import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useDevices() {
  const { data, error, isLoading, mutate } = useSWR("/api/devices", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    devices: data,
    error,
    isLoading,
    mutate,
  }
}

export function useDevice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/devices/${id}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    device: data,
    error,
    isLoading,
    mutate,
  }
}

export function useDeviceData(deviceId: string | null, range = "24h") {
  const { data, error, isLoading } = useSWR(deviceId ? `/api/devices/${deviceId}/data?range=${range}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    data: data,
    error,
    isLoading,
  }
}

export function useAlerts(deviceId?: string) {
  const query = deviceId ? `?deviceId=${deviceId}` : ""
  const { data, error, isLoading, mutate } = useSWR(`/api/alerts${query}`, fetcher)

  return {
    alerts: data?.alerts || [],
    error,
    isLoading,
    mutate,
  }
}
