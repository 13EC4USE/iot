import useSWR from "swr"

export function useAlerts(deviceId?: string) {
  const url = deviceId ? `/api/alerts?deviceId=${deviceId}` : "/api/alerts"

  const { data, error, isLoading, mutate } = useSWR(url, (u) => fetch(u).then(r => r.json()))

  return {
    alerts: data?.alerts || [],
    isLoading,
    error,
    mutate
  }
}
