"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Power,
  Zap,
  Thermometer,
  Droplets,
  Fan,
  Lightbulb,
  Wifi,
  Activity,
  Battery,
  Radio,
  Sun,
  Moon,
  Wind,
  Gauge as GaugeIcon,
  Settings as SettingsIcon,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useMqttControl } from "@/lib/hooks/useMqttControl"

const iconMap = {
  zap: Zap,
  thermometer: Thermometer,
  droplets: Droplets,
  fan: Fan,
  lightbulb: Lightbulb,
  wifi: Wifi,
  activity: Activity,
  battery: Battery,
  radio: Radio,
  sun: Sun,
  moon: Moon,
  wind: Wind,
  power: Power,
  gauge: GaugeIcon,
}

const colorMap = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/50" },
  green: { bg: "bg-green-500/20", text: "text-green-500", border: "border-green-500/50" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-500", border: "border-purple-500/50" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/50" },
  red: { bg: "bg-red-500/20", text: "text-red-500", border: "border-red-500/50" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/50" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-500", border: "border-pink-500/50" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-500", border: "border-cyan-500/50" },
}

interface CustomDeviceWidgetProps {
  device: any
  onCustomize?: () => void
  onControl?: (action: string) => void
}

export function CustomDeviceWidget({ device, onCustomize, onControl }: CustomDeviceWidgetProps) {
  const { toggleSwitch, setSliderValue } = useMqttControl()
  
  // Optimistic UI state
  const [isOn, setIsOn] = useState(device.power ?? false)
  const [sliderValue, setSliderValueLocal] = useState(
    device.lastData?.value ?? 50
  )
  const [isLoading, setIsLoading] = useState(false)

  // Sync with device state when it changes
  useEffect(() => {
    setIsOn(device.power ?? false)
  }, [device.power])

  useEffect(() => {
    if (device.lastData?.value !== undefined) {
      setSliderValueLocal(device.lastData.value)
    }
  }, [device.lastData?.value])

  const config = device.ui_config || {
    widgetType: "switch",
    icon: "zap",
    color: "blue",
    min: 0,
    max: 100,
    unit: "%",
  }

  const Icon = iconMap[config.icon as keyof typeof iconMap] || Zap
  const colors = colorMap[config.color as keyof typeof colorMap] || colorMap.blue

  // Get sensor value
  const sensorValue = device.lastData?.value ?? device.lastData?.temperature ?? 0

  const handleToggle = useCallback(async () => {
    const newStatus = !isOn
    
    // Optimistic update
    setIsOn(newStatus)
    setIsLoading(true)

    // Send MQTT command
    const success = await toggleSwitch(device, newStatus ? "on" : "off")
    
    setIsLoading(false)

    // Revert on failure
    if (!success) {
      setIsOn(!newStatus)
    }

    // Call parent handler
    onControl?.(newStatus ? "on" : "off")
  }, [isOn, device, toggleSwitch, onControl])

  const handleSliderChange = useCallback((value: number) => {
    // Optimistic update
    setSliderValueLocal(value)
    
    // Debounced MQTT publish
    setSliderValue(device, value)
    
    // Call parent handler
    onControl?.(`set_${value}`)
  }, [device, setSliderValue, onControl])

  const handleSliderRelease = useCallback(() => {
    // Send immediately on release
    setSliderValue(device, sliderValue, { immediate: true })
  }, [device, sliderValue, setSliderValue])

  // Switch Widget
  if (config.widgetType === "switch") {
    return (
      <Card className="p-6 bg-card border-border hover:shadow-lg transition-shadow relative group">
        {onCustomize && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCustomize}
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{device.name}</p>
              <p className="text-sm text-foreground/60">{device.type}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="lg"
            disabled={isLoading}
            className={`${isOn ? colors.bg : "bg-muted"} ${isOn ? colors.text : "text-muted-foreground"} hover:${colors.bg} transition-all`}
            onClick={handleToggle}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Power className="w-5 h-5" />
            )}
          </Button>
        </div>
      </Card>
    )
  }

  // Gauge Widget
  if (config.widgetType === "gauge") {
    const percentage = ((sensorValue - config.min) / (config.max - config.min)) * 100
    return (
      <Card className="p-6 bg-card border-border hover:shadow-lg transition-shadow relative group">
        {onCustomize && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCustomize}
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{device.name}</p>
            <p className="text-xs text-foreground/60">
              {config.min} - {config.max} {config.unit}
            </p>
          </div>
        </div>
        <div className="relative h-32 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-4xl font-bold ${colors.text}`}>
              {sensorValue.toFixed(1)}
            </p>
            <p className="text-sm text-foreground/60 mt-1">{config.unit}</p>
            <div className="mt-3 w-full bg-muted rounded-full h-2">
              <div
                className={`h-full rounded-full ${colors.bg} ${colors.border} border-2`}
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Slider Widget
  if (config.widgetType === "slider") {
    return (
      <Card className="p-6 bg-card border-border hover:shadow-lg transition-shadow relative group">
        {onCustomize && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCustomize}
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{device.name}</p>
            <p className="text-xs text-foreground/60">
              {config.min} - {config.max} {config.unit}
            </p>
          </div>
          <p className={`text-2xl font-bold ${colors.text}`}>{sliderValue}</p>
        </div>
        <input
          type="range"
          min={config.min}
          max={config.max}
          value={sliderValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full accent-current cursor-pointer"
          style={{ accentColor: colors.text.replace("text-", "") }}
        />
      </Card>
    )
  }

  // Stat Card Widget
  if (config.widgetType === "stat") {
    return (
      <Card className="p-6 bg-card border-border hover:shadow-lg transition-shadow relative group">
        {onCustomize && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onCustomize}
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <p className="text-sm text-foreground/60">{device.name}</p>
        </div>
        <div className="mt-4">
          <p className={`text-5xl font-bold ${colors.text}`}>
            {sensorValue.toFixed(1)}
            <span className="text-2xl ml-2">{config.unit}</span>
          </p>
          <Badge variant="secondary" className="mt-2">
            {device.type}
          </Badge>
        </div>
      </Card>
    )
  }

  return null
}
