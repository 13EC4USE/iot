# ✨ Features Documentation

## 📑 สารบัญ
1. [Dashboard Features](#dashboard-features)
2. [Device Management](#device-management)
3. [Map System](#map-system)
4. [Monitoring & Analytics](#monitoring--analytics)
5. [Settings & Control](#settings--control)
6. [Notifications](#notifications)
7. [Performance Features](#performance-features)

---

## Dashboard Features

### 📊 Real-Time Metrics
```
┌─────────────────────────────────────────┐
│  อุปกรณ์ทั้งหมด  │  ออนไลน์  │  ออฟไลน์  │  ข้อความ  │
│      12       │    9      │    3     │   1,234   │
└─────────────────────────────────────────┘
```

**Features:**
- ✅ Auto-update every 10 minutes
- ✅ Manual refresh button
- ✅ Color-coded status indicators
- ✅ Responsive layout

### 📈 Charts
```
1. Traffic Chart (24h)
   - Line chart showing message volume
   - Real-time data
   - Hoverable data points
   - Time axis labels

2. Online History Chart (7d)
   - Bar chart showing device status
   - Daily aggregation
   - Color legend (online=green, offline=red)

3. Donut Chart
   - Device ratio (online vs offline)
   - Percentage labels
   - Interactive legend
```

**Chart Features:**
- ✅ Theme-aware colors (dark/light)
- ✅ Responsive sizing
- ✅ Tooltip on hover
- ✅ Legend clickable
- ✅ Auto-scale axes
- ✅ Real-time updates

### 📋 Device Table
```
Device List (Top 5 Recent)
┌──────────┬───────┬──────────┬────┬──────┐
│ Name     │ Type  │ Location │ ⚡ │ Btry │
├──────────┼───────┼──────────┼────┼──────┤
│ Sensor 1 │ Temp  │ Room 1   │ 🟢 │ 85%  │
│ Sensor 2 │ Humid │ Room 2   │ 🔴 │ 45%  │
└──────────┴───────┴──────────┴────┴──────┘
```

**Features:**
- ✅ Online/offline badge
- ✅ Temperature, humidity display
- ✅ Battery percentage
- ✅ Signal strength
- ✅ Quick controls (ON/OFF)
- ✅ Timestamp of last update

---

## Device Management

### 🆕 Create Device
```
Form Fields:
├── Device Name (text)
├── Device Type (select)
│   ├── Temperature Sensor
│   ├── Humidity Sensor
│   ├── Motion Sensor
│   └── Custom
├── Location (text)
├── MQTT Topic (auto-fill)
├── Battery Level (number)
└── Signal Strength (number)
```

**Validation:**
- ✅ Name required
- ✅ Type required
- ✅ Unique MQTT topic
- ✅ Location optional but recommended

### ✏️ Edit Device
- ✅ Update all fields
- ✅ Change location with map picker
- ✅ Toggle is_active status
- ✅ Save changes
- ✅ Cancel without saving

### 🗺️ Location Picker
```
Interactive Map Dialog
├── Click map to pin location
├── Drag marker to adjust
├── Manual lat/long input
├── Quick location buttons
│   ├── Current Location
│   ├── Center Map
│   └── Random Location (demo)
└── Confirm Location
```

**Features:**
- ✅ Leaflet-based map
- ✅ Dark/light theme
- ✅ Draggable markers
- ✅ Real-time coordinates
- ✅ Validation
- ✅ Cancel option

### 🗑️ Delete Device
```
Safety Confirmation
├── Device name
├── Associated data count
├── Permanent warning
├── Confirm button
└── Cancel button
```

**Precautions:**
- ✅ Confirmation required
- ✅ Toast notification on success
- ✅ Error handling
- ✅ List auto-refresh

### 🎮 Device Control
```
Quick Actions Available:
├── Turn ON ✅
├── Turn OFF ❌
├── View Details 👁️
├── Edit 📝
└── Delete 🗑️
```

**Features:**
- ✅ Disabled when offline
- ✅ Command confirmation
- ✅ Toast feedback
- ✅ Disabled state styling
- ✅ Loading indicator

---

## Map System

### 🗺️ Interactive Map
```
Features:
├── Device Markers
│   ├── Green = Online
│   ├── Red = Offline
│   ├── Blue = Selected
│   └── Cluster = Multiple
├── Marker Popup
│   ├── Device name
│   ├── Type & status
│   ├── Last update
│   └── Quick actions
└── User Controls
    ├── Zoom in/out
    ├── Pan
    ├── Search
    └── Filter
```

**Map Features:**
- ✅ Leaflet.js library
- ✅ OpenStreetMap tiles
- ✅ Cluster markers
- ✅ Responsive sizing
- ✅ Touch gestures
- ✅ Custom icons

### 🔍 Search & Filter
```
Search Bar
├── Real-time filtering
├── Device name search
├── Type filtering
└── Status filtering

Results:
├── Matching devices highlighted
├── Non-matching grayed out
└── Count display
```

### 📍 Location Management
```
Edit Location Dialog
├── Map preview
├── Click to update
├── Coordinates display
└── Save button
```

---

## Monitoring & Analytics

### 📊 System Status Panel
```
Status Indicators:
├── System Health
│   ├── 🟢 Healthy (90%+ online)
│   ├── 🟡 Warning (70-90% online)
│   └── 🔴 Critical (< 70% online)
├── Online Ratio
│   ├── Progress bar
│   ├── Device count
│   └── Percentage
├── Active Alerts
│   ├── Count display
│   └── Severity badge
└── Active Users
    └── Session count
```

### 🖥️ Server Monitoring
```
Server Metrics:
├── System Uptime
│   └── Days/hours running
├── Response Time
│   └── Average latency
├── Storage Usage
│   ├── Used/Total
│   ├── Progress bar
│   └── Warning if > 80%
└── System Indicators
    ├── CPU Load
    ├── Database
    ├── Network
    └── Memory
```

### 🔄 Auto-Refresh Control
```
Toggle Buttons:
├── "عطل Auto-Refresh" (Default OFF)
│   ├── No requests sent
│   ├── Use cached data
│   └── Manual refresh only
└── "تشغيل Auto-Refresh"
    ├── Updates every 5 minutes
    ├── Current data shown
    └── Can still manual refresh
```

**Features:**
- ✅ State persists (localStorage)
- ✅ Blue banner when enabled
- ✅ Manual refresh anytime
- ✅ Shows last update time

---

## Settings & Control

### ⚙️ General Settings
```
Configuration Form:
├── Site Name (input)
├── Admin Email (input)
├── Alert Threshold (number)
├── Refresh Interval (number)
├── Max Devices Per User (number)
└── Data Retention Days (number)

Actions:
├── Save Settings (button)
├── Confirmation toast
└── Auto-clear on success
```

### 🔑 API Key Management
```
Generate API Key:
├── One-time generation
├── Random key format: iot_xxxxx
├── Copy to clipboard
├── Show/hide toggle
└── Secure password input

Key Display:
├── Masked by default
├── Reveal option
├── Copy button
└── Never shown twice
```

### 🛑 Service Control
```
Service Status Panel:
├── Status Indicator
│   ├── 🟢 "บริการทำงาน" (ON)
│   └── 🔴 "บริการหยุด" (OFF)
├── Current State Display
│   ├── Status badge
│   ├── Time of last change
│   └── Service description
└── Action Buttons
    ├── "หยุดบริการ" (when ON)
    │   ├── Confirmation required
    │   ├── Zero-cost operation
    │   └── Data cached shown
    └── "เริ่มบริการ" (when OFF)
        ├── Confirmation required
        ├── Resume normal operation
        └── Settings preserved
```

**Service Control Features:**
- ✅ Persists to localStorage
- ✅ Changes apply immediately
- ✅ No data loss
- ✅ Settings preserved
- ✅ Confirmation dialogs
- ✅ Status history tracked
- ✅ Cost savings enabled

### 📋 System Information
```
Display Panel:
├── Application Version
│   └── 1.0.0
├── Server Status
│   ├── 🟢 Online (service ON)
│   └── 🔴 Offline (service OFF)
├── Database
│   └── Supabase
└── MQTT Broker
    └── HiveMQ Cloud
```

---

## Notifications

### 🔔 Toast Notifications
```
Types:
├── Success (Green)
│   ├── "การบันทึก ... สำเร็จ"
│   ├── "ส่งคำสั่ง ... สำเร็จ"
│   └── Auto-dismiss 3s
├── Error (Red)
│   ├── Error message
│   ├── Manual dismiss
│   └── Stays until closed
└── Info (Blue)
    ├── Status updates
    ├── Auto-dismiss 2s
    └── Non-blocking

Position:
└── Bottom-right corner
```

**Features:**
- ✅ Styled variants
- ✅ Auto-dismiss
- ✅ Manual close option
- ✅ Non-blocking
- ✅ Multiple queue
- ✅ Smooth animations

### 📧 Alert System
```
Alert Types:
├── Critical 🔴
│   ├── Immediate notification
│   ├── Email sent
│   └── SMS optional
├── Warning 🟡
│   ├── Toast notification
│   ├── Log created
│   └── Dashboard badge
└── Info 🔵
    ├── Log created
    └── Dashboard only
```

---

## Performance Features

### ⚡ Caching Strategy
```
SWR Configuration:
├── Deduplication
│   └── 2 minutes (prevent duplicates)
├── Refresh Interval
│   ├── Dashboard: 10 minutes
│   ├── Devices: 5-10 minutes
│   ├── Settings: 10 minutes
│   └── Monitoring: 5 minutes (if enabled)
└── Error Handling
    ├── 2 retry attempts
    ├── 30 second retry interval
    └── Graceful fallback
```

### 📊 Request Optimization
```
Before Optimization:
Request/Hour: 290+
Cost: ~$0.5-1.0/hour

After Optimization:
Request/Hour: 23
Cost: ~$0.05-0.1/hour

Saving: 85-92% 💰
```

### 🎯 Manual Refresh
```
Clicking "รีเฟรช":
├── Force new API call
├── Bypass cache
├── Update all widgets
├── Show loading spinner
└── Toast on complete
```

---

## 🎨 Theme Support

### Dark/Light Mode
```
Auto Detection:
├── System preference
├── Auto-switch at sunset
└── Manual toggle (coming soon)

Applied To:
├── All pages
├── All components
├── Charts colors
├── Toast notifications
└── Maps colors
```

### Color Palette
```
Dark Mode:
├── Background: #1f2937, #111827
├── Text: #f3f4f6, #e5e7eb
├── Accent: #14b8a6 (teal)
└── Borders: #374151

Light Mode:
├── Background: #ffffff, #f9fafb
├── Text: #1f2937, #374151
├── Accent: #0d9488 (teal)
└── Borders: #e5e7eb
```

---

## 🔐 Security Features

### Authentication
- ✅ Supabase Auth integration
- ✅ Session management
- ✅ Protected routes
- ✅ Token refresh

### Authorization
- ✅ Role-based access
- ✅ Admin verification
- ✅ User isolation
- ✅ Device ownership check

### Data Protection
- ✅ HTTPS only (in production)
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS security

---

## 📱 Responsive Design

### Breakpoints
```
Mobile (< 640px)
├── Single column layout
├── Stack components
└── Touch-friendly

Tablet (640px - 1024px)
├── Two column layout
├── Optimized spacing
└── Readable fonts

Desktop (> 1024px)
├── Three+ columns
├── Full features
└── Optimized whitespace
```

---

## 🎯 Upcoming Features

- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Webhooks & integrations
- [ ] Automation rules
- [ ] Multi-tenancy
- [ ] SAML/SSO
- [ ] GraphQL API
- [ ] Machine learning insights

---

**Last Updated**: December 7, 2025  
**Version**: 1.0.0  
**Status**: Full Feature Set ✅
