# Refresh Controls Implementation Guide

## Overview
Implemented smart refresh controls to save API requests by making auto-refresh **opt-in** instead of automatic.

## Key Features

### 1. Manual Refresh Button
- **Icon**: 🔄 RefreshCw
- **Behavior**: Immediate refresh on click
- **Always Available**: Even when auto-refresh is OFF

### 2. Auto-Refresh Toggle
- **Default State**: OFF (to conserve API requests)
- **Toggle Icon**: 
  - ⏸️ Pause (when OFF) → Click to enable auto-refresh
  - ▶️ Play (when ON) → Click to disable auto-refresh
- **Visual Indicator**: Default state is highlighted differently

### 3. Refresh Interval Selector
- **Available When**: Auto-refresh is enabled
- **Options**: 5s, 10s, 15s, 30s, 1m, 2m
- **Default Values**:
  - Dashboard-v2: 30s
  - Sensor-Data: 30s (configurable)
  - Workflow: 10s

### 4. Responsive Design
- **Mobile**: Shows only icons (compact view)
- **Desktop**: Shows icons + labels
- **Loading State**: Manual refresh button shows spinning icon during fetch

## Implementation Details

### Component: `RefreshControls`
**Location**: `components/admin/refresh-controls.tsx`

**Props**:
```typescript
interface RefreshControlsProps {
  loading?: boolean                    // Show spinner on refresh button
  autoRefresh: boolean                 // Current auto-refresh state
  onAutoRefreshChange: (value: boolean) => void  // Toggle callback
  onRefresh: () => void               // Manual refresh callback
  refreshInterval?: number            // Current interval in seconds
  onRefreshIntervalChange?: (interval: number) => void  // Interval change callback
}
```

### Pages Updated

#### 1. Dashboard-v2 (`/admin/dashboard-v2`)
- **Purpose**: Live IoT device overview
- **Default**: Auto-refresh OFF, 30s interval
- **Data**: Fetches devices, sensor_data (last 24), device_alerts
- **Real-time**: Supabase subscription on sensor_data INSERT

#### 2. Sensor-Data (`/admin/sensor-data`)
- **Purpose**: Display latest 10 sensor readings
- **Default**: Auto-refresh OFF, 30s interval
- **Data**: Latest 10 readings from sensor_data table
- **Shows**: Ammonia (ppm), Temperature (°C), Humidity (%), Device name, Timestamp

#### 3. Workflow (`/admin/workflow`)
- **Purpose**: Monitor data flow (ESP32→MQTT→Pi→Supabase→Web)
- **Default**: Auto-refresh OFF, 10s interval
- **Data**: Checks each workflow step status
- **Status**: 4-step visualization with timestamps

## API Usage Optimization

### Before
- Pages auto-refreshed on mount
- User had to navigate away to disable fetching
- Wasted requests when page was idle
- Real-time subscriptions + polling caused duplication

### After
- Auto-refresh OFF by default (no requests on page load)
- Manual refresh available on demand
- User explicitly enables auto-refresh if needed
- Real-time subscriptions still active (efficient event-driven updates)

## State Management

### Each page maintains:
```typescript
const [autoRefresh, setAutoRefresh] = useState(false)          // OFF by default
const [refreshInterval, setRefreshInterval] = useState(30000)  // 30 seconds
const [loading, setLoading] = useState(false)                  // UI feedback

useEffect(() => {
  if (!autoRefresh) return  // Don't fetch if auto-refresh is OFF
  
  // Fetch data immediately
  const fetchData = async () => { /* ... */ }
  fetchData()
  
  // Set up interval for auto-refresh
  const interval = setInterval(fetchData, refreshInterval)
  return () => clearInterval(interval)
}, [autoRefresh, refreshInterval])  // Re-run when toggle/interval changes
```

## Usage Examples

### Basic Setup in a Page
```tsx
import { RefreshControls } from "@/components/admin/refresh-controls"

export default function MyPage() {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Fetch data here
      const response = await fetch('/api/my-endpoint')
      const data = await response.json()
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-between items-center">
      <h1>My Dashboard</h1>
      <RefreshControls
        loading={loading}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        onRefresh={handleRefresh}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
      />
    </div>
  )
}
```

## Real-Time Integration

### Supabase Subscriptions
- Active at all times (independent of refresh interval)
- Listen for INSERT events on relevant tables
- Automatically update UI when new data arrives
- No polling needed while auto-refresh is OFF

### Combined Approach
1. **Real-time subscription**: Catches new data immediately
2. **Manual refresh**: Pull latest if subscription missed something
3. **Auto-refresh**: For continuous monitoring when enabled

## Performance Benefits

### Request Savings
- No requests on page load if auto-refresh OFF
- Manual refresh only when needed
- Configurable intervals (can be set to 2+ minutes)

### Examples
- **Without controls**: 1 refresh/page load + 1 refresh/30s = ~2880 requests/day
- **With controls**: Only when manually triggered + real-time updates = ~50-100 requests/day

## Maintenance Notes

### Adding to New Pages
1. Import component: `import { RefreshControls } from "@/components/admin/refresh-controls"`
2. Add state hooks for autoRefresh, refreshInterval, loading
3. Create refresh function that fetches your data
4. Pass props to `<RefreshControls />` component
5. Use useEffect to implement polling when autoRefresh is true

### Future Enhancements
- [ ] Save user's preferred refresh interval to localStorage
- [ ] Add "manual-only" mode option (no interval selector)
- [ ] Add request rate indicator (requests/min)
- [ ] Add visual "last updated" timestamp
- [ ] Add "smart refresh" that adapts interval based on data change frequency
