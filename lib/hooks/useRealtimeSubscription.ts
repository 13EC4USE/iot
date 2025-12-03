"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export function useRealtimeSubscription<T>(tableName: string, deviceId?: string) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupSubscription = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Initial fetch
        let query = supabase.from(tableName).select("*")
        if (deviceId && tableName === "sensor_data") {
          query = query.eq("device_id", deviceId).order("timestamp", { ascending: false }).limit(100)
        }

        const { data: initialData, error: fetchError } = await query

        if (fetchError) {
          setError(fetchError.message)
          setIsLoading(false)
          return
        }

        setData(initialData || [])

        // Subscribe to changes
        const subscription = supabase
          .channel(`${tableName}_changes`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: tableName,
              ...(deviceId && { filter: `device_id=eq.${deviceId}` }),
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setData((prev) => [payload.new as T, ...prev])
              } else if (payload.eventType === "UPDATE") {
                setData((prev) => prev.map((item: any) => (item.id === payload.new.id ? (payload.new as T) : item)))
              } else if (payload.eventType === "DELETE") {
                setData((prev) => prev.filter((item: any) => item.id !== payload.old.id))
              }
            },
          )
          .subscribe()

        setIsLoading(false)

        return () => {
          subscription?.unsubscribe()
        }
      } catch (err) {
        console.error("[v0] Subscription error:", err)
        setError("Failed to setup real-time subscription")
        setIsLoading(false)
      }
    }

    setupSubscription()
  }, [tableName, deviceId])

  return { data, isLoading, error }
}
