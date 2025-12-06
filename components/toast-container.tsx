"use client"

import { useToastStore } from "@/lib/hooks/useToast"
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"
import { useEffect, useState } from "react"

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 border-green-500/30"
      case "error":
        return "bg-red-500/20 border-red-500/30"
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/30"
      case "info":
      default:
        return "bg-blue-500/20 border-blue-500/30"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm ${getBgColor(toast.type)} animate-in fade-in slide-in-from-right-5`}
        >
          <div className="flex-shrink-0">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            {toast.title && <h4 className="font-semibold text-foreground">{toast.title}</h4>}
            <p className={`text-sm ${toast.title ? "text-foreground/80" : "text-foreground"}`}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-foreground/60 hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
