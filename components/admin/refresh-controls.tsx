"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Pause, Play } from "lucide-react"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RefreshControlsProps {
  loading?: boolean
  autoRefresh: boolean
  onAutoRefreshChange: (value: boolean) => void
  onRefresh: () => void
  refreshInterval?: number
  onRefreshIntervalChange?: (interval: number) => void
}

export function RefreshControls({
  loading = false,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  refreshInterval = 30,
  onRefreshIntervalChange,
}: RefreshControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Manual Refresh */}
      <Button
        onClick={onRefresh}
        disabled={loading}
        variant="outline"
        size="sm"
        title="Refresh now"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline ml-1">Refresh</span>
      </Button>

      {/* Auto Refresh Toggle */}
      <Button
        onClick={() => onAutoRefreshChange(!autoRefresh)}
        variant={autoRefresh ? "default" : "outline"}
        size="sm"
        title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
      >
        {autoRefresh ? (
          <>
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Auto ON</span>
          </>
        ) : (
          <>
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Auto OFF</span>
          </>
        )}
      </Button>

      {/* Refresh Interval Selector */}
      {autoRefresh && onRefreshIntervalChange && (
        <Select value={String(refreshInterval)} onValueChange={(v) => onRefreshIntervalChange(Number(v))}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5s</SelectItem>
            <SelectItem value="10">10s</SelectItem>
            <SelectItem value="15">15s</SelectItem>
            <SelectItem value="30">30s</SelectItem>
            <SelectItem value="60">1m</SelectItem>
            <SelectItem value="120">2m</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
