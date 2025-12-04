import { useEffect, useState } from "react"
import mqtt from "mqtt/dist/mqtt"

export function useRealtimeDeviceData(device, initialData = []) {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (!device?.mqtt_topic) return

    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER!, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    })

    client.on("connect", () => {
      client.subscribe(device.mqtt_topic)
    })

    client.on("message", (_, payload) => {
      let json = null
      try {
        json = JSON.parse(payload.toString())
      } catch {
        return
      }

      setData((prev) => {
        const arr = [...prev, json]
        if (arr.length > 500) arr.splice(0, arr.length - 500)
        return arr
      })
    })

    return () => client.end(true)
  }, [device?.mqtt_topic])

  return data
}
