"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Power, PowerOff, AlertCircle, CheckCircle2, Wifi, Settings as SettingsIcon, Plus, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Device {
  device_id: string
  broker: string
  port: number
  topic_prefix: string
  enabled: boolean
  uuid: string
  last_updated: string
}

interface MQTTConfig {
  broker: string
  port: number
  use_auth: boolean
  username: string
  password: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  
  // General settings state
  const [settings, setSettings] = useState({
    siteName: "IoT Hub",
    adminEmail: "admin@iot.com",
    alertThreshold: 30,
    refreshInterval: 5,
    maxDevicesPerUser: 50,
    dataRetentionDays: 90,
  })

  // Device config state
  const [devices, setDevices] = useState<Record<string, Device>>({})
  const [mqtt, setMqtt] = useState<MQTTConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showNewDevice, setShowNewDevice] = useState(false)
  const [piConnected, setPiConnected] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<any[]>([])

  // General settings state
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isServiceActive, setIsServiceActive] = useState(true)
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null)

  // New device form
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    broker: '192.168.1.142',
    port: 1883,
    topic_prefix: 'iot/',
    uuid: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadSettings = () => {
    const saved = localStorage.getItem("iot_settings")
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }

  useEffect(() => {
    loadSettings()
    loadConfig()
    loadAvailableDevices()
    
    // Load service status from localStorage
    const savedStatus = localStorage.getItem("iot_service_active")
    if (savedStatus !== null) {
      setIsServiceActive(JSON.parse(savedStatus))
    }
    // Load last status change time
    const lastChange = localStorage.getItem("iot_last_status_change")
    if (lastChange) {
      setLastStatusChange(new Date(lastChange))
    }

    // Check Pi connection every 30 seconds
    const interval = setInterval(checkPiConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkPiConnection() {
    try {
      const response = await fetch('/api/iot-config?action=mqtt')
      setPiConnected(response.ok)
    } catch {
      setPiConnected(false)
    }
  }

  async function loadAvailableDevices() {
    try {
      const response = await fetch('/api/devices')
      if (response.ok) {
        const data = await response.json()
        setAvailableDevices(data)
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  async function loadConfig() {
    try {
      setLoading(true)
      await checkPiConnection()

      // Load devices
      const devRes = await fetch('/api/iot-config?action=devices')
      const devData = await devRes.json()
      if (devData.devices) {
        setDevices(devData.devices)
      }

      // Load MQTT config
      const mqttRes = await fetch('/api/iot-config?action=mqtt')
      const mqttData = await mqttRes.json()
      if (mqttData.mqtt) {
        setMqtt(mqttData.mqtt)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveMqttConfig() {
    if (!mqtt) return

    try {
      setSaving(true)
      const response = await fetch('/api/iot-config?action=mqtt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mqtt),
      })

      const data = await response.json()
      if (data.status === 'success') {
        toast({
          title: '✅ อัปเดต MQTT สำเร็จ',
          description: `Broker: ${mqtt.broker}:${mqtt.port}`,
        })
      } else {
        toast({
          title: '❌ อัปเดต MQTT ล้มเหลว',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '❌ เกิดข้อผิดพลาด',
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function addDevice() {
    if (!newDevice.device_id || !newDevice.uuid) {
      toast({
        title: '⚠️ ข้อมูลไม่ครบ',
        description: 'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(
        `/api/iot-config?action=device&device_id=${newDevice.device_id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDevice),
        }
      )

      const data = await response.json()
      if (data.status === 'success') {
        setNewDevice({
          device_id: '',
          broker: '192.168.1.142',
          port: 1883,
          topic_prefix: 'iot/',
          uuid: '',
        })
        setShowNewDevice(false)
        await loadConfig()
        
        toast({
          title: '✅ เพิ่มอุปกรณ์สำเร็จ',
          description: `เพิ่ม ${newDevice.device_id} เรียบร้อยแล้ว`,
        })
      } else {
        toast({
          title: '❌ เพิ่มอุปกรณ์ล้มเหลว',
          description: data.message || 'เกิดข้อผิดพลาด',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '❌ เพิ่มอุปกรณ์ล้มเหลว',
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function deleteDevice(deviceId: string) {
    if (!confirm(`ลบอุปกรณ์ '${deviceId}' หรือไม่?`)) return

    try {
      const response = await fetch(
        `/api/iot-config?device_id=${deviceId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()
      if (data.status === 'success') {
        setDevices((prev) => {
          const newDevices = { ...prev }
          delete newDevices[deviceId]
          return newDevices
        })
        toast({
          title: '✅ ลบอุปกรณ์สำเร็จ',
          description: `ลบ ${deviceId} เรียบร้อยแล้ว`,
        })
      }
    } catch (error) {
      toast({
        title: '❌ ลบอุปกรณ์ล้มเหลว',
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด',
        variant: 'destructive',
      })
    }
  }

  const handleChange = (key: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem("iot_settings", JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const generateApiKey = () => {
    const key = `iot_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`
    setApiKey(key)
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      alert("คัดลอกแล้ว")
    }
  }

  const handleStopService = () => {
    const confirmed = window.confirm(
      "คุณแน่ใจหรือว่าต้องการหยุดบริการ?\nจะหยุดการส่งคำขอไปยัง Supabase, HiveMQ และ Server\nค่าใช้จ่ายจะหยุดนับ"
    )
    if (confirmed) {
      setIsServiceActive(false)
      const now = new Date()
      setLastStatusChange(now)
      localStorage.setItem("iot_service_active", JSON.stringify(false))
      localStorage.setItem("iot_last_status_change", now.toISOString())
    }
  }

  const handleStartService = () => {
    const confirmed = window.confirm(
      "คุณแน่ใจหรือว่าต้องการเริ่มบริการต่อ?\nระบบจะกลับมาทำงานปกติและหากมี request จะเริ่มนับค่าใช้จ่ายอีกครั้ง"
    )
    if (confirmed) {
      setIsServiceActive(true)
      const now = new Date()
      setLastStatusChange(now)
      localStorage.setItem("iot_service_active", JSON.stringify(true))
      localStorage.setItem("iot_last_status_change", now.toISOString())
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ ตั้งค่าระบบ</h1>
        <p className="text-slate-400 mt-2">จัดการการตั้งค่าระบบ IoT และอุปกรณ์ของคุณ</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">ตั้งค่าทั่วไป</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">อุปกรณ์</span>
          </TabsTrigger>
          <TabsTrigger value="service" className="flex items-center gap-2">
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">บริการ</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าทั่วไป</CardTitle>
              <CardDescription>จัดการตั้งค่าระบบพื้นฐาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "ชื่อเว็บไซต์", key: "siteName", type: "text" },
                { label: "อีเมลแอดมิน", key: "adminEmail", type: "email" },
                { label: "ขีดจำกัดการแจ้งเตือน", key: "alertThreshold", type: "number" },
                { label: "ช่วงเวลารีเฟรช (นาที)", key: "refreshInterval", type: "number" },
                { label: "จำนวนอุปกรณ์สูงสุดต่อผู้ใช้", key: "maxDevicesPerUser", type: "number" },
                { label: "เก็บข้อมูลเป็นเวลา (วัน)", key: "dataRetentionDays", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  <Input
                    type={field.type}
                    value={settings[field.key as keyof typeof settings]}
                    onChange={(e) =>
                      handleChange(
                        field.key,
                        field.type === "number" ? Number.parseInt(e.target.value) : e.target.value,
                      )
                    }
                  />
                </div>
              ))}
              <div className="pt-4">
                <Button onClick={handleSave} className="w-full">
                  {saved ? "✅ บันทึกแล้ว" : "บันทึกการตั้งค่า"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKey ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded border">
                    <p className="text-sm mb-2">API Key ของคุณ:</p>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? "ซ่อน" : "แสดง"}
                      </Button>
                      <Button onClick={copyApiKey}>คัดลอก</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button onClick={generateApiKey} variant="outline" className="w-full">
                  สร้าง API Key
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>สถานะระบบ</span>
                <span className={`text-sm font-semibold ${piConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {piConnected ? '🟢 เชื่อมต่อแล้ว' : '🔴 ไม่ได้เชื่อมต่อ'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">ตัวจัดการ Config บน Raspberry Pi เชื่อมต่อผ่าน REST API</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่า MQTT Broker</CardTitle>
              <CardDescription>ตั้งค่าเครื่อง Raspberry Pi ที่รับข้อมูลจาก ESP32</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mqtt && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Broker Address</label>
                    <Input
                      value={mqtt.broker}
                      onChange={(e) => setMqtt({...mqtt, broker: e.target.value})}
                      placeholder="192.168.1.142"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Port</label>
                    <Input
                      type="number"
                      value={mqtt.port}
                      onChange={(e) => setMqtt({...mqtt, port: Number(e.target.value)})}
                      placeholder="1883"
                    />
                  </div>
                  <Button onClick={saveMqttConfig} disabled={saving} className="w-full">
                    {saving ? 'บันทึก...' : 'บันทึก MQTT'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>อุปกรณ์ที่ลงทะเบียน</span>
                <Dialog open={showNewDevice} onOpenChange={setShowNewDevice}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      เพิ่มอุปกรณ์
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Device ID</label>
                        <Input
                          value={newDevice.device_id}
                          onChange={(e) => setNewDevice({...newDevice, device_id: e.target.value})}
                          placeholder="esp32-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">UUID</label>
                        <Input
                          value={newDevice.uuid}
                          onChange={(e) => setNewDevice({...newDevice, uuid: e.target.value})}
                          placeholder="550e8400-e29b-41d4-a716-446655440000"
                        />
                      </div>
                      <Button onClick={addDevice} disabled={saving} className="w-full">
                        {saving ? 'เพิ่ม...' : 'เพิ่มอุปกรณ์'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(devices).length === 0 ? (
                <p className="text-slate-600">ไม่มีอุปกรณ์ที่ลงทะเบียน</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(devices).map(([id, device]) => (
                    <div key={id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded border">
                      <div>
                        <p className="font-semibold">{device.device_id}</p>
                        <p className="text-xs text-slate-600">{device.broker}:{device.port}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDevice(device.device_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tab */}
        <TabsContent value="service" className="space-y-6">
          <Card className={piConnected ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {piConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>บริการทำงาน</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span>บริการหยุด</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  สถานะ: {isServiceActive ? "✅ ทำงาน" : "⏸️ หยุด"}
                </p>
                {lastStatusChange && (
                  <p className="text-xs text-slate-600">
                    เปลี่ยนสถานะล่าสุด: {lastStatusChange.toLocaleString("th-TH")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {isServiceActive ? (
                  <Button onClick={handleStopService} variant="destructive" className="w-full">
                    <PowerOff className="w-4 h-4 mr-2" />
                    หยุดบริการ
                  </Button>
                ) : (
                  <Button onClick={handleStartService} className="w-full bg-green-600 hover:bg-green-700">
                    <Power className="w-4 h-4 mr-2" />
                    เริ่มบริการ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">เวอร์ชัน</span>
                <span className="font-semibold">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">สถานะ</span>
                <span className={isServiceActive ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {isServiceActive ? "ออนไลน์ 🟢" : "ปิด 🔴"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">ฐานข้อมูล</span>
                <span className="font-semibold">Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">MQTT</span>
                <span className="font-semibold">Raspberry Pi</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
