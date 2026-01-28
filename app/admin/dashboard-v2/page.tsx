"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Droplet,
  Activity,
  MapPin,
  Clock,
  Plus,
  Search,
  Loader
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { RefreshControls } from "@/components/admin/refresh-controls"

interface Device {
  id: string
  name: string
  mqtt_client_id: string
  location: string
  is_active: boolean
  last_update: string
}

interface SensorReading {
  id: string
  device_id: string
  value: number
  temperature: number
  humidity: number
  timestamp: string
}

interface Alert {
  id: string
  device_id: string
  type: string
  level: 'warning' | 'critical'
  message: string
  created_at: string
  resolved: boolean
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [readings, setReadings] = useState<Map<string, SensorReading[]>>(new Map())
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)  // Default: OFF to save requests
  const [refreshInterval, setRefreshInterval] = useState(30)  // 30 seconds
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const supabase = createClient()

  // Load data from Supabase
  async function loadData() {
    setLoading(true)
    try {
      // 1. Fetch all devices
      const { data: devicesData, error: devicesError } = await supabase
        .from("devices")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (devicesError) throw devicesError
      setDevices(devicesData || [])

      // 3. Fetch latest readings for each device
      if (devicesData && devicesData.length > 0) {
        const readingsMap = new Map<string, SensorReading[]>()
        
        for (const device of devicesData) {
          const { data: readingData, error: readingError } = await supabase
            .from("sensor_data")
            .select("*")
            .eq("device_id", device.id)
            .order("timestamp", { ascending: false })
            .limit(24)  // Last 24 readings

          if (!readingError && readingData) {
            readingsMap.set(device.id, readingData)
          }
        }
        
        setReadings(readingsMap)
      }

      // 3. Fetch active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("device_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!alertsError && alertsData) {
        setAlerts(alertsData)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Setup auto-refresh
  useEffect(() => {
    loadData()

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("public:sensor_data")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        () => {
          loadData() // Reload when new data arrives
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filter devices
  const filteredDevices = devices.filter(device => {
    const matchesFilter = filter === "all" || 
      (filter === "online" && device.last_update && 
        new Date(device.last_update).getTime() > Date.now() - 5 * 60000) ||
      (filter === "offline" && (!device.last_update || 
        new Date(device.last_update).getTime() <= Date.now() - 5 * 60000))
    
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.mqtt_client_id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Get latest reading for device
  const getLatestReading = (deviceId: string): SensorReading | null => {
    const deviceReadings = readings.get(deviceId)
    return deviceReadings && deviceReadings.length > 0 ? deviceReadings[0] : null
  }

  // Check if device is online
  const isDeviceOnline = (device: Device): boolean => {
    if (!device.last_update) return false
    const lastUpdateTime = new Date(device.last_update).getTime()
    return Date.now() - lastUpdateTime < 5 * 60000 // 5 minutes
  }

  // Calculate stats
  const stats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(isDeviceOnline).length,
    offlineDevices: devices.length - devices.filter(isDeviceOnline).length,
    activeAlerts: alerts.filter(a => !a.resolved).length,
    criticalAlerts: alerts.filter(a => !a.resolved && a.level === 'critical').length,
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">IoT Dashboard</h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <RefreshControls
            loading={loading}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            onRefresh={loadData}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
          />
          <Link href="/admin/devices">
            <Button size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.onlineDevices}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.offlineDevices}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.activeAlerts}
            </div>
            {stats.criticalAlerts > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {stats.criticalAlerts} critical
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {stats.activeAlerts > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Active Alerts ({stats.activeAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-start justify-between p-2 bg-white dark:bg-slate-900 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={alert.level === 'critical' ? 'destructive' : 'secondary'}
                  >
                    {alert.level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-32">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map(device => {
          const latestReading = getLatestReading(device.id)
          const online = isDeviceOnline(device)
          
          return (
            <Link key={device.id} href={`/admin/control?device=${device.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {device.location || "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge variant={online ? "default" : "secondary"}>
                      {online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {latestReading ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Ammonia</p>
                          <p className="text-lg font-bold">{latestReading.value.toFixed(1)} ppm</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Temp</p>
                          <p className="text-lg font-bold">{latestReading.temperature.toFixed(1)}°C</p>
                        </div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Humidity</p>
                        <p className="text-lg font-bold">{latestReading.humidity.toFixed(1)}%</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(latestReading.timestamp).toLocaleTimeString()}
                        </p>
                        {alerts.some(a => a.device_id === device.id && !a.resolved) && (
                          <Badge variant="destructive" className="text-xs">
                            Alert
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-24 text-muted-foreground">
                      <p className="text-sm">No data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredDevices.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-muted-foreground">No devices found</p>
        </Card>
      )}
    </div>
  )
}
