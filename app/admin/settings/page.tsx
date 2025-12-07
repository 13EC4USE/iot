"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Power, PowerOff, AlertCircle, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "IoT Hub",
    adminEmail: "admin@iot.com",
    alertThreshold: 30,
    refreshInterval: 5,
    maxDevicesPerUser: 50,
    dataRetentionDays: 90,
  })

  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isServiceActive, setIsServiceActive] = useState(true)
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSettings()
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
  }, [])

  const loadSettings = () => {
    // Load from localStorage for now
    const saved = localStorage.getItem("iot_settings")
    if (saved) {
      setSettings(JSON.parse(saved))
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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-white mb-2">ตั้งค่าระบบ</h1>
      <p className="text-slate-400 mb-6">จัดการตั้งค่าระบบ IoT ของคุณ</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
            <h2 className="text-xl font-bold text-white mb-4">การตั้งค่าทั่วไป</h2>

            <div className="space-y-4">
              {[
                { label: "ชื่อเว็บไซต์", key: "siteName", type: "text" },
                { label: "อีเมลแอดมิน", key: "adminEmail", type: "email" },
                { label: "ขีดจำกัดการแจ้งเตือน", key: "alertThreshold", type: "number" },
                { label: "ช่วงเวลารีเฟรช (นาที)", key: "refreshInterval", type: "number" },
                { label: "จำนวนอุปกรณ์สูงสุดต่อผู้ใช้", key: "maxDevicesPerUser", type: "number" },
                { label: "เก็บข้อมูลเป็นเวลา (วัน)", key: "dataRetentionDays", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    value={settings[field.key as keyof typeof settings]}
                    onChange={(e) =>
                      handleChange(
                        field.key,
                        field.type === "number" ? Number.parseInt(e.target.value) : e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              ))}

              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  {saved ? "บันทึกแล้ว" : "บันทึกการตั้งค่า"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
            <h2 className="text-xl font-bold text-white mb-4">API Keys</h2>

            <div className="space-y-4">
              {apiKey ? (
                <div className="bg-slate-600 rounded p-4 border border-teal-500/50">
                  <p className="text-sm text-slate-300 mb-2">API Key ของคุณ:</p>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-500 rounded text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-slate-300"
                    >
                      {showApiKey ? "ซ่อน" : "แสดง"}
                    </button>
                    <button onClick={copyApiKey} className="px-3 py-2 bg-teal-500 hover:bg-teal-600 rounded text-white">
                      คัดลอก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateApiKey}
                  className="w-full bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 rounded-lg transition border border-slate-500"
                >
                  สร้าง API Key
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Service Control */}
          <div className={`rounded-lg p-6 border ${
            isServiceActive 
              ? "bg-green-500/10 border-green-500/50" 
              : "bg-red-500/10 border-red-500/50"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {isServiceActive ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <span className="text-green-400">บริการทำงาน</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <span className="text-red-400">บริการหยุด</span>
                  </>
                )}
              </h3>
            </div>

            <div className="space-y-3 mb-4 text-sm">
              <div>
                <p className={isServiceActive ? "text-green-300" : "text-red-300"}>
                  สถานะ: {isServiceActive ? "✅ ทำงาน" : "⏸️ หยุด"}
                </p>
              </div>
              {lastStatusChange && (
                <div>
                  <p className="text-slate-400 text-xs">
                    เปลี่ยนสถานะล่าสุด:
                  </p>
                  <p className={`font-mono text-xs ${isServiceActive ? "text-green-400" : "text-red-400"}`}>
                    {lastStatusChange.toLocaleString("th-TH")}
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-slate-500">
                <p className="text-slate-400 text-xs">
                  {isServiceActive 
                    ? "ระบบกำลังส่ง request ไปยัง Supabase, HiveMQ และ Server"
                    : "บริการถูกปิด - ไม่มีการส่ง request และไม่มีค่าใช้จ่าย"
                  }
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {isServiceActive ? (
                <button
                  onClick={handleStopService}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <PowerOff className="w-5 h-5" />
                  หยุดบริการ
                </button>
              ) : (
                <button
                  onClick={handleStartService}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Power className="w-5 h-5" />
                  เริ่มบริการ
                </button>
              )}
              <p className="text-xs text-slate-400 text-center">
                คลิกปุ่มเพื่อเปลี่ยนสถานะบริการ
              </p>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-bold text-white mb-4">ข้อมูลระบบ</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">เวอร์ชันแอปพลิเคชัน</p>
                <p className="text-white font-semibold">1.0.0</p>
              </div>

              <div>
                <p className="text-slate-400">สถานะเซิร์ฟเวอร์</p>
                <p className={isServiceActive ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                  {isServiceActive ? "ออนไลน์ 🟢" : "ปิด 🔴"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">ฐานข้อมูล</p>
                <p className="text-white font-semibold">Supabase</p>
              </div>

              <div>
                <p className="text-slate-400">MQTT Broker</p>
                <p className="text-white font-semibold">HiveMQ Cloud</p>
              </div>
            </div>
          </div>

          <div className="bg-teal-500/10 rounded-lg p-6 border border-teal-500/50">
            <h3 className="text-lg font-bold text-teal-400 mb-2">เคล็ดลับ</h3>
            <p className="text-sm text-teal-200">ตรวจสอบข้อมูลผู้ใช้และการตั้งค่าอย่างสม่ำเสมอเพื่อให้ระบบทำงานได้อย่างปลอดภัย</p>
          </div>
        </div>
      </div>
    </div>
  )
}
