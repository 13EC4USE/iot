"use client"

import { useAlerts } from "@/lib/hooks/useSWR"
import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, Trash2, Check, RefreshCw, Bell, BellOff } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export default function AlertsPage() {
  const { alerts, mutate, isLoading } = useAlerts()
  const [filterType, setFilterType] = useState("all")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      mutate()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, mutate])

  // Realtime subscription for new alerts
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_alerts',
        },
        () => {
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])

  const filteredAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return []
    
    return alerts.filter((alert: any) => {
      if (filterType !== "all" && alert.type !== filterType) return false
      if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false
      if (filterRead === "read" && !alert.is_read) return false
      if (filterRead === "unread" && alert.is_read) return false
      return true
    })
  }, [alerts, filterType, filterSeverity, filterRead])

  const stats = useMemo(() => {
    if (!alerts || alerts.length === 0) {
      return { total: 0, unread: 0, critical: 0 }
    }
    
    return {
      total: alerts.length,
      unread: alerts.filter((a: any) => !a.is_read).length,
      critical: alerts.filter((a: any) => a.severity === "critical").length,
    }
  }, [alerts])

  const handleMarkAllAsRead = async () => {
    if (!confirm("ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว?")) return

    try {
      const unreadAlerts = alerts?.filter((a: any) => !a.is_read) || []
      
      await Promise.all(
        unreadAlerts.map((alert: any) =>
          fetch(`/api/alerts/${alert.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          })
        )
      )

      mutate()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const handleMarkAsRead = async (alertId: string, isRead: boolean) => {
    setMarkingAsRead(alertId)
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: !isRead }),
      })

      if (response.ok) {
        mutate()
      } else {
        alert("ไม่สามารถอัพเดทการแจ้งเตือนได้")
      }
    } catch (error) {
      console.error("Failed to mark alert:", error)
      alert("เกิดข้อผิดพลาด")
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนนี้?")) {
      return
    }

    setDeleting(alertId)
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        mutate()
      } else {
        alert("ไม่สามารถลบการแจ้งเตือนได้")
      }
    } catch (error) {
      console.error("Failed to delete alert:", error)
      alert("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-500 border-red-500/30"
      case "warning":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "info":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />
      case "warning":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">ประวัติการแจ้งเตือน</h1>
            <p className="text-sm text-foreground/60">จัดการและติดตามการแจ้งเตือนทั้งหมด</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`gap-2 ${autoRefresh ? 'text-accent' : ''}`}
          >
            {autoRefresh ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{autoRefresh ? 'Auto' : 'Manual'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </Button>
          {stats.unread > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">อ่านทั้งหมด</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 border-border">
          <p className="text-xs uppercase tracking-wide text-foreground/60">รวมทั้งหมด</p>
          <p className="text-3xl font-semibold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-xs uppercase tracking-wide text-foreground/60">ยังไม่อ่าน</p>
          <p className="text-3xl font-semibold text-blue-500">{stats.unread}</p>
        </Card>
        <Card className="p-4 border-border">
          <p className="text-xs uppercase tracking-wide text-foreground/60">วิกฤต</p>
          <p className="text-3xl font-semibold text-red-500">{stats.critical}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-card border-border mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">ตัวกรอง</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">ประเภท</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="threshold_exceeded">เกินค่าขีดจำกัด</SelectItem>
                <SelectItem value="device_offline">อุปกรณ์ออฟไลน์</SelectItem>
                <SelectItem value="battery_low">แบตเตอรี่ต่ำ</SelectItem>
                <SelectItem value="error">ข้อผิดพลาด</SelectItem>
                <SelectItem value="connection_lost">การเชื่อมต่อขาดหาย</SelectItem>
                <SelectItem value="sensor_error">เซ็นเซอร์ผิดพลาด</SelectItem>
                <SelectItem value="maintenance_required">ต้องการบำรุงรักษา</SelectItem>
                <SelectItem value="custom">กำหนดเอง</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">ระดับความสำคัญ</label>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="critical">วิกฤต</SelectItem>
                <SelectItem value="warning">คำเตือน</SelectItem>
                <SelectItem value="info">ข้อมูล</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">สถานะการอ่าน</label>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="unread">ยังไม่อ่าน</SelectItem>
                <SelectItem value="read">อ่านแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <Card className="p-6 bg-card border-border">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
            <p className="text-foreground/60">ไม่มีการแจ้งเตือนที่ตรงกับตัวกรอง</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition ${
                  alert.is_read
                    ? "bg-background/50 border-border/50"
                    : "bg-background border-accent/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {alert.message}
                      </h4>
                      {!alert.is_read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {alert.devices?.name || 'Unknown Device'}
                      </Badge>
                      <span className="text-xs text-foreground/60">
                        {alert.type === "threshold_exceeded" && "เกินค่าขีดจำกัด"}
                        {alert.type === "device_offline" && "อุปกรณ์ออฟไลน์"}
                        {alert.type === "battery_low" && "แบตเตอรี่ต่ำ"}
                        {alert.type === "error" && "ข้อผิดพลาด"}
                        {alert.type === "connection_lost" && "การเชื่อมต่อขาดหาย"}
                        {alert.type === "sensor_error" && "เซ็นเซอร์ผิดพลาด"}
                        {alert.type === "maintenance_required" && "ต้องการบำรุงรักษา"}
                        {alert.type === "custom" && "กำหนดเอง"}
                      </span>
                    </div>
                    
                    <p className="text-xs text-foreground/50">
                      {new Date(alert.created_at).toLocaleString("th-TH", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(alert.id, alert.is_read)}
                      disabled={markingAsRead === alert.id}
                      className={
                        alert.is_read
                          ? "text-foreground/60 hover:text-foreground"
                          : "text-blue-500 hover:text-blue-600"
                      }
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={deleting === alert.id}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
