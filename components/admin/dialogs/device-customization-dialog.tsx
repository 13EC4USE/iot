"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Power,
  Gauge,
  SlidersHorizontal,
  BarChart3,
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
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react"
import { useToast } from "@/lib/hooks/useToast"

// Widget Type Definitions
const widgetTypes = [
  {
    id: "switch",
    name: "Switch",
    description: "Toggle on/off control",
    icon: Power,
    color: "bg-blue-500/20 text-blue-500 border-blue-500/50",
  },
  {
    id: "gauge",
    name: "Gauge",
    description: "Visual meter display",
    icon: Gauge,
    color: "bg-purple-500/20 text-purple-500 border-purple-500/50",
  },
  {
    id: "slider",
    name: "Slider",
    description: "Adjustable value control",
    icon: SlidersHorizontal,
    color: "bg-green-500/20 text-green-500 border-green-500/50",
  },
  {
    id: "stat",
    name: "Stat Card",
    description: "Simple value display",
    icon: BarChart3,
    color: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  },
]

// Icon Options
const iconOptions = [
  { id: "zap", name: "Zap", icon: Zap },
  { id: "thermometer", name: "Thermometer", icon: Thermometer },
  { id: "droplets", name: "Droplets", icon: Droplets },
  { id: "fan", name: "Fan", icon: Fan },
  { id: "lightbulb", name: "Lightbulb", icon: Lightbulb },
  { id: "wifi", name: "Wifi", icon: Wifi },
  { id: "activity", name: "Activity", icon: Activity },
  { id: "battery", name: "Battery", icon: Battery },
  { id: "radio", name: "Radio", icon: Radio },
  { id: "sun", name: "Sun", icon: Sun },
  { id: "moon", name: "Moon", icon: Moon },
  { id: "wind", name: "Wind", icon: Wind },
  { id: "power", name: "Power", icon: Power },
  { id: "gauge", name: "Gauge", icon: Gauge },
]

// Color Options
const colorOptions = [
  { id: "blue", name: "Blue", value: "rgb(59, 130, 246)", bg: "bg-blue-500" },
  { id: "green", name: "Green", value: "rgb(34, 197, 94)", bg: "bg-green-500" },
  { id: "purple", name: "Purple", value: "rgb(168, 85, 247)", bg: "bg-purple-500" },
  { id: "orange", name: "Orange", value: "rgb(249, 115, 22)", bg: "bg-orange-500" },
  { id: "red", name: "Red", value: "rgb(239, 68, 68)", bg: "bg-red-500" },
  { id: "yellow", name: "Yellow", value: "rgb(234, 179, 8)", bg: "bg-yellow-500" },
  { id: "pink", name: "Pink", value: "rgb(236, 72, 153)", bg: "bg-pink-500" },
  { id: "cyan", name: "Cyan", value: "rgb(6, 182, 212)", bg: "bg-cyan-500" },
]

// Form Schema
const formSchema = z.object({
  widgetType: z.enum(["switch", "gauge", "slider", "stat"]),
  icon: z.string().min(1, "Please select an icon"),
  color: z.string().min(1, "Please select a color"),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface DeviceCustomizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any
  onSave?: () => void
}

export function DeviceCustomizationDialog({
  open,
  onOpenChange,
  device,
  onSave,
}: DeviceCustomizationDialogProps) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("switch")
  const [selectedIcon, setSelectedIcon] = useState<string>("zap")
  const [selectedColor, setSelectedColor] = useState<string>("blue")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      widgetType: "switch",
      icon: "zap",
      color: "blue",
      min: 0,
      max: 100,
      unit: "%",
    },
  })

  // Load existing ui_config
  useEffect(() => {
    if (device?.ui_config) {
      const config = device.ui_config
      if (config.widgetType) setSelectedType(config.widgetType)
      if (config.icon) setSelectedIcon(config.icon)
      if (config.color) setSelectedColor(config.color)
      setValue("widgetType", config.widgetType || "switch")
      setValue("icon", config.icon || "zap")
      setValue("color", config.color || "blue")
      setValue("min", config.min || 0)
      setValue("max", config.max || 100)
      setValue("unit", config.unit || "%")
    }
  }, [device, setValue])

  const watchedValues = watch()

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setValue("widgetType", typeId as any)
  }

  const handleIconSelect = (iconId: string) => {
    setSelectedIcon(iconId)
    setValue("icon", iconId)
  }

  const handleColorSelect = (colorId: string) => {
    setSelectedColor(colorId)
    setValue("color", colorId)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/devices/${device.id}/customize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ui_config: {
            widgetType: data.widgetType,
            icon: data.icon,
            color: data.color,
            min: data.min,
            max: data.max,
            unit: data.unit,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save customization")
      }

      toast.success("บันทึกการปรับแต่งเรียบร้อย")
      onOpenChange(false)
      onSave?.()
    } catch (error) {
      console.error("Failed to save customization:", error)
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  // Preview Component
  const PreviewWidget = () => {
    const SelectedIcon = iconOptions.find((i) => i.id === selectedIcon)?.icon || Zap
    const selectedColorObj = colorOptions.find((c) => c.id === selectedColor)

    if (selectedType === "switch") {
      return (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${selectedColorObj?.bg}/20`}>
                <SelectedIcon className={`w-6 h-6 ${selectedColorObj?.bg.replace("bg-", "text-")}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{device?.name || "Device Name"}</p>
                <p className="text-sm text-foreground/60">{device?.type || "Device Type"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="lg"
              className={`${selectedColorObj?.bg}/20 ${selectedColorObj?.bg.replace("bg-", "text-")} hover:${selectedColorObj?.bg}/30`}
            >
              <Power className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      )
    }

    if (selectedType === "gauge") {
      return (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${selectedColorObj?.bg}/20`}>
              <SelectedIcon className={`w-5 h-5 ${selectedColorObj?.bg.replace("bg-", "text-")}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{device?.name || "Device Name"}</p>
              <p className="text-xs text-foreground/60">
                {watchedValues.min || 0} - {watchedValues.max || 100} {watchedValues.unit || "%"}
              </p>
            </div>
          </div>
          <div className="relative h-32 flex items-center justify-center">
            <div className="text-center">
              <p className={`text-4xl font-bold ${selectedColorObj?.bg.replace("bg-", "text-")}`}>
                {((watchedValues.min || 0) + (watchedValues.max || 100)) / 2}
              </p>
              <p className="text-sm text-foreground/60 mt-1">{watchedValues.unit || "%"}</p>
            </div>
          </div>
        </Card>
      )
    }

    if (selectedType === "slider") {
      return (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${selectedColorObj?.bg}/20`}>
              <SelectedIcon className={`w-5 h-5 ${selectedColorObj?.bg.replace("bg-", "text-")}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{device?.name || "Device Name"}</p>
              <p className="text-xs text-foreground/60">
                {watchedValues.min || 0} - {watchedValues.max || 100} {watchedValues.unit || "%"}
              </p>
            </div>
            <p className={`text-2xl font-bold ${selectedColorObj?.bg.replace("bg-", "text-")}`}>
              {((watchedValues.min || 0) + (watchedValues.max || 100)) / 2}
            </p>
          </div>
          <input
            type="range"
            min={watchedValues.min || 0}
            max={watchedValues.max || 100}
            value={((watchedValues.min || 0) + (watchedValues.max || 100)) / 2}
            className="w-full"
            disabled
          />
        </Card>
      )
    }

    if (selectedType === "stat") {
      return (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${selectedColorObj?.bg}/20`}>
              <SelectedIcon className={`w-5 h-5 ${selectedColorObj?.bg.replace("bg-", "text-")}`} />
            </div>
            <p className="text-sm text-foreground/60">{device?.name || "Device Name"}</p>
          </div>
          <div className="mt-4">
            <p className={`text-5xl font-bold ${selectedColorObj?.bg.replace("bg-", "text-")}`}>
              {((watchedValues.min || 0) + (watchedValues.max || 100)) / 2}
              <span className="text-2xl ml-2">{watchedValues.unit || "%"}</span>
            </p>
          </div>
        </Card>
      )
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Customize Device</DialogTitle>
          <DialogDescription>
            Configure how this device appears on your dashboard
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section A: Widget Type Selector */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Widget Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {widgetTypes.map((type) => {
                  const Icon = type.icon
                  const isSelected = selectedType === type.id
                  return (
                    <Card
                      key={type.id}
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        isSelected
                          ? `${type.color} border-2`
                          : "bg-card border-border hover:border-accent"
                      }`}
                      onClick={() => handleTypeSelect(type.id)}
                    >
                      <div className="text-center space-y-2">
                        <div className="flex justify-center">
                          <Icon className="w-8 h-8" />
                        </div>
                        <p className="font-semibold">{type.name}</p>
                        <p className="text-xs opacity-80">{type.description}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
              {errors.widgetType && (
                <p className="text-sm text-red-500 mt-2">{errors.widgetType.message}</p>
              )}
            </div>

            {/* Section B: Configuration */}
            <div className="space-y-6">
              <Label className="text-base font-semibold block">Configuration</Label>

              {/* Icon Picker */}
              <div>
                <Label className="text-sm mb-3 block">Icon</Label>
                <div className="grid grid-cols-7 gap-2">
                  {iconOptions.map((icon) => {
                    const Icon = icon.icon
                    const isSelected = selectedIcon === icon.id
                    return (
                      <Button
                        key={icon.id}
                        type="button"
                        variant="ghost"
                        size="lg"
                        className={`aspect-square ${
                          isSelected
                            ? "bg-accent text-background"
                            : "bg-card border-border hover:border-accent"
                        }`}
                        onClick={() => handleIconSelect(icon.id)}
                      >
                        <Icon className="w-5 h-5" />
                      </Button>
                    )
                  })}
                </div>
                {errors.icon && (
                  <p className="text-sm text-red-500 mt-2">{errors.icon.message}</p>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <Label className="text-sm mb-3 block">Color</Label>
                <div className="flex gap-3 flex-wrap">
                  {colorOptions.map((color) => {
                    const isSelected = selectedColor === color.id
                    return (
                      <Button
                        key={color.id}
                        type="button"
                        variant="ghost"
                        className={`w-12 h-12 rounded-full ${color.bg} ${
                          isSelected ? "ring-4 ring-accent ring-offset-2 ring-offset-background" : ""
                        }`}
                        onClick={() => handleColorSelect(color.id)}
                      />
                    )
                  })}
                </div>
                {errors.color && (
                  <p className="text-sm text-red-500 mt-2">{errors.color.message}</p>
                )}
              </div>

              {/* Conditional Fields for Gauge/Slider */}
              {(selectedType === "gauge" || selectedType === "slider" || selectedType === "stat") && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">Min Value</Label>
                    <Input
                      type="number"
                      {...register("min", { valueAsNumber: true })}
                      placeholder="0"
                    />
                    {errors.min && (
                      <p className="text-sm text-red-500 mt-1">{errors.min.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Max Value</Label>
                    <Input
                      type="number"
                      {...register("max", { valueAsNumber: true })}
                      placeholder="100"
                    />
                    {errors.max && (
                      <p className="text-sm text-red-500 mt-1">{errors.max.message}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Unit</Label>
                    <Input {...register("unit")} placeholder="°C, %, etc." />
                    {errors.unit && (
                      <p className="text-sm text-red-500 mt-1">{errors.unit.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section C: Live Preview */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Live Preview</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 bg-background/50">
                <PreviewWidget />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-accent text-background">
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Customization
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
