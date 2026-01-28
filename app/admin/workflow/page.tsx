"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, ArrowRight, Activity, Database, Wifi, Cloud } from "lucide-react"
import { RefreshControls } from "@/components/admin/refresh-controls"

interface WorkflowStatus {
  esp32ToMqtt: {
    status: 'online' | 'offline' | 'checking'
    lastMessage?: string
    messageCount?: number
  }
  mqttToPi: {
    status: 'online' | 'offline' | 'checking'
    lastReceived?: string
    activeTopics?: string[]
  }
  piToSupabase: {
    status: 'online' | 'offline' | 'checking'
    lastSync?: string
    syncCount?: number
  }
  supabaseToWeb: {
    status: 'online' | 'offline' | 'checking'
    lastFetch?: string
    recordCount?: number
  }
}

export default function WorkflowPage() {
  const [loading, setLoading] = useState(true)
  const [workflow, setWorkflow] = useState<WorkflowStatus>({
    esp32ToMqtt: { status: 'checking' },
    mqttToPi: { status: 'checking' },
    piToSupabase: { status: 'checking' },
    supabaseToWeb: { status: 'checking' },
  })
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [deviceMap, setDeviceMap] = useState<Map<string, string>>(new Map())
  const [autoRefresh, setAutoRefresh] = useState(false)  // Default: OFF to save requests
  const [refreshInterval, setRefreshInterval] = useState(10)  // 10 seconds

  useEffect(() => {
    checkWorkflow()
    
    if (autoRefresh) {
      const interval = setInterval(checkWorkflow, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  async function checkWorkflow() {
    setLoading(true)
    try {
      // ดึงข้อมูล sensor_data ล่าสุดจาก Supabase
      const sensorRes = await fetch('/api/devices/sensor-data?limit=10')
      
      if (!sensorRes.ok) {
        console.error('Failed to fetch sensor data:', sensorRes.status)
        throw new Error(`API error: ${sensorRes.status}`)
      }
      
      const sensorDataResponse = await sensorRes.json()
      const sensorData = Array.isArray(sensorDataResponse) ? sensorDataResponse : sensorDataResponse.data || []
      
      console.log('Sensor data received:', sensorData.length, 'records')
      setRecentMessages(sensorData)

      // คำนวณสถานะแต่ละขั้น
      const now = new Date().getTime()
      let esp32Status: 'online' | 'offline' = 'offline'
      let lastMessageTime = 0
      let messageCount = 0

      if (sensorData.length > 0) {
        const latestData = sensorData[0]
        const lastTimestamp = latestData.timestamp || latestData.created_at
        if (lastTimestamp) {
          lastMessageTime = new Date(lastTimestamp).getTime()
          const timeSinceLastMessage = now - lastMessageTime
          
          // ถ้าข้อมูลเข้ามาน้อยกว่า 30 นาที ให้ถือว่า online
          esp32Status = timeSinceLastMessage < 30 * 60 * 1000 ? 'online' : 'offline'
        }
        
        // นับจำนวน messages วันนี้ (Bangkok timezone = UTC+7)
        const todayBangkok = new Date()
        todayBangkok.setHours(todayBangkok.getHours() + 7) // Convert to Bangkok
        const todayString = todayBangkok.toISOString().split('T')[0] // "YYYY-MM-DD"
        
        messageCount = sensorData.filter((d: any) => {
          const msgTimestamp = d.timestamp || d.created_at
          if (!msgTimestamp) return false
          
          // แปลงเป็น Bangkok time
          const msgDate = new Date(msgTimestamp)
          msgDate.setHours(msgDate.getHours() + 7)
          const msgString = msgDate.toISOString().split('T')[0]
          
          return msgString === todayString
        }).length
      }

      const lastMessageTimestamp = sensorData.length > 0 
        ? (sensorData[0].timestamp || sensorData[0].created_at || 'ไม่ทราบ')
        : 'ไม่ทราบ'

      setWorkflow({
        esp32ToMqtt: {
          status: esp32Status,
          lastMessage: lastMessageTimestamp,
          messageCount: messageCount,
        },
        mqttToPi: {
          status: esp32Status,
          lastReceived: lastMessageTimestamp,
          activeTopics: ['sensors/ammonia'],
        },
        piToSupabase: {
          status: esp32Status,
          lastSync: lastMessageTimestamp,
          syncCount: messageCount,
        },
        supabaseToWeb: {
          status: 'online',
          lastFetch: new Date().toISOString(),
          recordCount: sensorData.length,
        },
      })
    } catch (error) {
      console.error('Failed to check workflow:', error)
      setWorkflow({
        esp32ToMqtt: { status: 'offline' },
        mqttToPi: { status: 'offline' },
        piToSupabase: { status: 'offline' },
        supabaseToWeb: { status: 'offline' },
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
    }
  }

  const getStatusBadge = (status: 'online' | 'offline' | 'checking') => {
    const colors = {
      online: 'bg-green-500/20 text-green-600 border-green-500/30',
      offline: 'bg-red-500/20 text-red-600 border-red-500/30',
      checking: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    }
    const labels = {
      online: '🟢 ออนไลน์',
      offline: '🔴 ออฟไลน์',
      checking: '🟡 กำลังตรวจสอบ...',
    }
    return (
      <Badge variant="outline" className={`${colors[status]} font-medium`}>
        {labels[status]}
      </Badge>
    )
  }

  // Format datetime to DD/MM/YYYY HH:mm:ss (Bangkok time = UTC+7, AD)
  const formatDateTime = (timestamp?: string) => {
    if (!timestamp || timestamp === 'ไม่ทราบ' || timestamp === 'ยังไม่มีข้อมูล') return 'ไม่มีข้อมูล'
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'ไม่มีข้อมูล'
      
      // แปลงเป็น Bangkok time (UTC+7)
      const bangkokTime = new Date(date.getTime() + (7 * 60 * 60 * 1000))
      const day = String(bangkokTime.getUTCDate()).padStart(2, '0')
      const month = String(bangkokTime.getUTCMonth() + 1).padStart(2, '0')
      const year = bangkokTime.getUTCFullYear()
      const hours = String(bangkokTime.getUTCHours()).padStart(2, '0')
      const minutes = String(bangkokTime.getUTCMinutes()).padStart(2, '0')
      const seconds = String(bangkokTime.getUTCSeconds()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    } catch {
      return 'ไม่มีข้อมูล'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">🔄 ตรวจสอบ Workflow</h1>
          <p className="text-sm text-foreground/60 mt-1">
            ติดตามการไหลของข้อมูลจาก ESP32 ผ่าน MQTT → Pi → Supabase → เว็บไซต์
          </p>
        </div>
        <RefreshControls
          loading={loading}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={checkWorkflow}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
        />
      </div>

      {/* Workflow Visualization - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 สถานะการเชื่อมต่อ</CardTitle>
          <CardDescription>ESP32 → MQTT → Pi → Supabase → เว็บไซต์</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Step 1: ESP32 → MQTT */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Activity className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">ESP32 ส่งข้อมูล</h3>
                    {getStatusIcon(workflow.esp32ToMqtt.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📨 {workflow.esp32ToMqtt.messageCount || 0} ข้อความวันนี้ • 
                    🕐 {workflow.esp32ToMqtt.lastMessage && workflow.esp32ToMqtt.lastMessage !== 'ไม่พบข้อมูล'
                      ? formatDateTime(workflow.esp32ToMqtt.lastMessage)
                      : 'ยังไม่มีข้อมูล'}
                  </p>
                </div>
                {getStatusBadge(workflow.esp32ToMqtt.status)}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>

            {/* Step 2: MQTT → Pi */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Wifi className="w-8 h-8 text-purple-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">Pi รับข้อมูล (MQTT)</h3>
                    {getStatusIcon(workflow.mqttToPi.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📡 {workflow.mqttToPi.activeTopics?.join(', ') || 'sensors/ammonia'} • 
                    🕐 {workflow.mqttToPi.lastReceived && workflow.mqttToPi.lastReceived !== 'ไม่ทราบ'
                      ? formatDateTime(workflow.mqttToPi.lastReceived)
                      : 'ยังไม่มีข้อมูล'}
                  </p>
                </div>
                {getStatusBadge(workflow.mqttToPi.status)}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>

            {/* Step 3: Pi → Supabase */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Database className="w-8 h-8 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">บันทึกลง Supabase</h3>
                    {getStatusIcon(workflow.piToSupabase.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💾 {workflow.piToSupabase.syncCount || 0} บันทึกวันนี้ • 
                    🕐 {workflow.piToSupabase.lastSync && workflow.piToSupabase.lastSync !== 'ไม่ทราบ'
                      ? formatDateTime(workflow.piToSupabase.lastSync)
                      : 'ยังไม่มีข้อมูล'}
                  </p>
                </div>
                {getStatusBadge(workflow.piToSupabase.status)}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>

            {/* Step 4: Supabase → Web */}
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <Cloud className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">แสดงผลบนเว็บ</h3>
                    {getStatusIcon(workflow.supabaseToWeb.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📊 {workflow.supabaseToWeb.recordCount || 0} records • 
                    🕐 {workflow.supabaseToWeb.lastFetch
                      ? formatDateTime(workflow.supabaseToWeb.lastFetch)
                      : 'ไม่ทราบ'}
                  </p>
                </div>
                {getStatusBadge(workflow.supabaseToWeb.status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลล่าสุดจาก Sensor (10 รายการล่าสุด)</CardTitle>
          <CardDescription>แสดงข้อมูลที่บันทึกใน Supabase แบบเรียลไทม์</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่พบข้อมูล sensor ในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">เวลา</th>
                    <th className="text-left p-2">Device ID</th>
                    <th className="text-left p-2">ค่า</th>
                    <th className="text-left p-2">อุณหภูมิ</th>
                    <th className="text-left p-2">ความชื้น</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMessages.map((msg, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">
                        {formatDateTime(msg.timestamp)}
                      </td>
                      <td className="p-2 font-mono text-xs">{deviceMap.get(msg.device_id) || msg.device_id?.substring(0, 8) + '...'}</td>
                      <td className="p-2">
                        <Badge variant="secondary">{msg.value} {msg.unit || ''}</Badge>
                      </td>
                      <td className="p-2">{msg.temperature ? `${msg.temperature}°C` : '-'}</td>
                      <td className="p-2">{msg.humidity ? `${msg.humidity}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">💡 เคล็ดลับการแก้ไขปัญหา</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>ESP32 → MQTT ออฟไลน์:</strong> ตรวจสอบ WiFi และ MQTT broker (Pi) ว่าทำงานหรือไม่</p>
          <p>• <strong>MQTT → Pi ออฟไลน์:</strong> ตรวจสอบ mqtt_listener.cjs บน Pi ว่าทำงานอยู่หรือไม่</p>
          <p>• <strong>Pi → Supabase ออฟไลน์:</strong> ตรวจสอบ API key และ Supabase URL ใน Pi</p>
          <p>• <strong>Supabase → Web ออฟไลน์:</strong> ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและ Supabase status</p>
        </CardContent>
      </Card>
    </div>
  )
}
