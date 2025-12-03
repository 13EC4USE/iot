"use client"

import { useDevices, useAlerts } from "@/lib/hooks/useSWR"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Activity, Wifi, AlertCircle, Power, Loader } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { useEffect, useState } from "react"
import mqtt from "mqtt/dist/mqtt"
import { formatISO, parseISO } from "date-fns"

export default function DashboardPage() {
  const { devices, isLoading: devicesLoading, error: devicesError } = useDevices()
  const { alerts, isLoading: alertsLoading } = useAlerts()

  const onlineCount = devices?.filter((d: any) => d.is_active).length || 0
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const selectedDevice = devices?.find((d: any) => d.id === selectedDeviceId)
  const offlineCount = (devices?.length || 0) - onlineCount
  const [mqttConnected, setMqttConnected] = useState(false)
  const [kpis, setKpis] = useState({ totalPower: 0, avgTemp: 0, avgHumidity: 0 })

  // Historical + realtime sensor data state
  const [deviceData, setDeviceData] = useState<Record<string, Array<any>>>({})
  const currentDeviceData = (selectedDeviceId && deviceData[selectedDeviceId]) || []
  const latestDataPoint = currentDeviceData[currentDeviceData.length - 1]

  useEffect(() => {
    // KPIs computation
    const data = (selectedDeviceId && deviceData[selectedDeviceId]) || []
    const temps: number[] = data.map((d) => d.temperature).filter(Number.isFinite)
    const humidities: number[] = data.map((d) => d.humidity).filter(Number.isFinite)
    const avgTemp = temps.length > 0 ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : 0
    const avgHumidity = humidities.length > 0 ? Math.round((humidities.reduce((a, b) => a + b, 0) / humidities.length) * 10) / 10 : 0
    const totalPower = devices?.length ? devices.length * 120 : 0 // placeholder watts per device
    setKpis({ totalPower, avgTemp, avgHumidity })
  }, [devices, deviceData, selectedDeviceId])

  // Default device selection
  useEffect(() => {
    if (!selectedDeviceId && devices && devices.length > 0) {
      setSelectedDeviceId(devices[0].id)
    }
  }, [devices, selectedDeviceId])

  useEffect(() => {
    // Try connecting to MQTT broker from the browser to show connection status (best-effort)
    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER
    if (!broker) return

    const opts: any = {
      connectTimeout: 4000,
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      clientId: `${process.env.NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX || 'web'}${Math.random().toString(16).slice(2, 8)}`,
    }

    let client: any
    try {
      client = mqtt.connect(broker, opts)
    } catch (e) {
      console.warn('MQTT connect failed', e)
      setMqttConnected(false)
      return
    }

    client.on('connect', () => setMqttConnected(true))
    client.on('reconnect', () => setMqttConnected(false))
    client.on('close', () => setMqttConnected(false))
    client.on('error', () => setMqttConnected(false))

    // cleanup
    return () => {
      try {
        client.end(true)
      } catch {}
    }
  }, [])

  // Fetch historical data for selected device
  useEffect(() => {
    if (!selectedDeviceId) return

    const fetchFor = async (deviceId: string) => {
      try {
        const res = await fetch(`/api/devices/${deviceId}/data?range=24h`)      
        if (!res.ok) return
        const rows = await res.json()
        setDeviceData((prev) => ({ ...prev, [deviceId]: rows || [] }))
      } catch (e) {
        console.warn('fetch device data failed', e)
      }
    }

    fetchFor(selectedDeviceId)
  }, [selectedDeviceId])

  // Subscribe to device topics for realtime updates
  useEffect(() => {
    if (!devices || devices.length === 0 || !selectedDeviceId) return
    if (!selectedDevice || !selectedDevice.mqtt_topic) return

    const broker = process.env.NEXT_PUBLIC_MQTT_BROKER
    if (!broker) return

    const opts: any = {
      connectTimeout: 4000,
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      clientId: `${process.env.NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX || 'web-realtime'}${Math.random().toString(16).slice(2, 8)}`,
    }

    let client: any
    try {
      client = mqtt.connect(broker, opts)
    } catch (e) {
      console.warn('MQTT connect failed for realtime', e)
      return
    }

    client.on('connect', () => {
      client.subscribe(selectedDevice.mqtt_topic)
    })

    client.on('message', async (topic: string, payload: Buffer) => {
      const raw = payload.toString()
      let parsed: any = null
      try {
        parsed = JSON.parse(raw)
      } catch {
        // not JSON, try numeric
        const n = parseFloat(raw)
        parsed = { value: isFinite(n) ? n : raw }
      }

      const device = devices.find((d: any) => d.mqtt_topic === topic)
      if (!device) return

      const row: any = {
        device_id: device.id,
        value: parsed.value ?? null,
        temperature: parsed.temperature ?? parsed.temp ?? null,
        humidity: parsed.humidity ?? null,
        unit: parsed.unit ?? null,
        timestamp: parsed.timestamp ?? new Date().toISOString(),
      }

      // append to local state
      setDeviceData((prev) => {
        const list = prev[device.id] ? [...prev[device.id]] : []
        list.push({ ...row })
        // keep last 500
        if (list.length > 500) list.splice(0, list.length - 500)
        return { ...prev, [device.id]: list }
      })

      // persist to server
      try {
        await fetch(`/api/devices/${device.id}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        })
      } catch (e) {
        console.warn('persist sensor_data failed', e)
      }
    })

    return () => {
      try {
        client.end(true)
      } catch {}
    }
  }, [devices, selectedDeviceId, selectedDevice])

  const groupedDevices =
    devices?.reduce((acc: Record<string, any[]>, device: any) => {
      const type = device.type || "อื่น ๆ"
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(device)
      return acc
    }, {}) || {}

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">จัดการอุปกรณ์</h1>
          <p className="text-foreground/60">ตรวจสอบและควบคุมอุปกรณ์ IoT ของคุณในเวลาจริง</p>
        </div>
        <Select onValueChange={setSelectedDeviceId} value={selectedDeviceId || ""}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="เลือกอุปกรณ์" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedDevices).map(([type, deviceList]) => (
              <SelectGroup key={type}>
                <SelectLabel>{type}</SelectLabel>
                {deviceList.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "ทั้งหมดอุปกรณ์",
            value: devices?.length || "0",
            icon: Wifi,
            color: "text-accent",
          },
          {
            label: "ออนไลน์",
            value: onlineCount,
            icon: Activity,
            color: "text-green-500",
          },
          {
            label: "ออฟไลน์",
            value: offlineCount,
            icon: AlertCircle,
            color: "text-red-500",
          },
          {
            label: "การแจ้งเตือน",
            value: alerts?.length || "0",
            icon: Power,
            color: "text-blue-500",
          },
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 bg-card border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-foreground/60 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}

        {/* System Status card */}
        <Card className="p-6 bg-card border-border col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground/60 text-sm mb-1">สถานะระบบ</p>
              <p className="text-xl font-semibold text-foreground">{mqttConnected ? "MQTT Broker: เชื่อมต่อแล้ว" : "MQTT Broker: ตัดการเชื่อมต่อ"}</p>
              <p className="text-foreground/60 text-sm mt-1">KPIs: กำลังไฟรวม {kpis.totalPower}W · Ø อุณหภูมิ {kpis.avgTemp}°C · Ø ความชื้น {kpis.avgHumidity}%</p>
            </div>
            <div className="text-right">
              <div className={`w-3 h-3 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">อุณหภูมิและความชื้น</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentDeviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="timestamp"
                stroke="var(--color-foreground)"
                opacity={0.5}
                tickFormatter={(str) => new Date(str).toLocaleTimeString("th-TH")}
              />
              <YAxis yAxisId="left" stroke="var(--color-accent)" opacity={0.5} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--color-primary)" opacity={0.5} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                labelFormatter={(label) => new Date(label).toLocaleString("th-TH")}
              />
              <Line yAxisId="left" type="monotone" dataKey="temperature" name="อุณหภูมิ" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" name="ความชื้น" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">สถานะการใช้พลังงาน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentDeviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" stroke="var(--color-foreground)" opacity={0.5} />
              <YAxis stroke="var(--color-foreground)" opacity={0.5} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="var(--color-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Real-time Monitoring */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">การตรวจสอบแบบเรียลไทม์</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices?.slice(0, 3).map((device: any) => (
            <Card key={device.id} className="p-4 bg-card border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-foreground">{device.name}</p>
                  <p className="text-sm text-foreground/60">{device.type}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${device.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {device.id === selectedDeviceId
                      ? latestDataPoint?.temperature
                        ? `${latestDataPoint.temperature}°C`
                        : latestDataPoint?.humidity
                        ? `${latestDataPoint.humidity}%`
                        : latestDataPoint?.value ?? "—"
                      : "—"}
                  </p>
                  <p className="text-sm text-foreground/60">ค่าล่าสุด</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${device.battery_level}%` }} />
                  </div>
                  <p className="text-sm text-foreground/60 mt-1">แบตเตอรี่ {device.battery_level}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4">แผงควบคุม</h2>
        <Card className="p-6 bg-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(devices && devices.length > 0 ? devices.slice(0, 3) : []).map((device: any) => (
              <div key={device.id} className="p-4 bg-background rounded-lg border border-border">
                <p className="font-medium text-foreground mb-2">{device.name}</p>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!device.power}
                      onChange={async (e) => {
                        const res = await fetch(`/api/devices/${device.id}/control`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'power', value: e.target.checked }),
                        })
                        if (res.ok) {
                          // simple reload
                          location.reload()
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-foreground/60">เปิด/ปิด</span>
                  </label>
                </div>
                <div className="mt-4">
                  <label className="text-sm text-foreground/60">ค่าที่ตั้งไว้</label>
                  <input type="number" className="w-full mt-1 p-2 bg-background border border-border rounded-lg text-foreground" placeholder="ตั้งค่า" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Device List */}
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">รายการอุปกรณ์</h3>

        {devicesLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-accent animate-spin" />
            <span className="ml-2 text-foreground/60">กำลังโหลดอุปกรณ์...</span>
          </div>
        )}

        {devicesError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            เกิดข้อผิดพลาดในการโหลดอุปกรณ์
          </div>
        )}

        {devices && devices.length > 0 ? (
          <div className="space-y-4">
            {devices.map((device: any) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-accent/50 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{device.name}</p>
                    <p className="text-sm text-foreground/60">{device.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">{device.battery_level}%</p>
                    <div className={`text-sm ${device.is_active ? "text-green-500" : "text-red-500"}`}>
                      {device.is_active ? "● ออนไลน์" : "● ออฟไลน์"}
                    </div>
                  </div>
                  <Button className="bg-accent text-background hover:bg-accent/90">ควบคุม</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-foreground/60">ไม่มีอุปกรณ์ที่ลงทะเบียน</div>
        )}
      </Card>
    </div>
  )
}