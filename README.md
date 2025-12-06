# 🌐 IoT Web Platform - Smart Device Management System

> **ระบบจัดการอุปกรณ์ IoT แบบ Full-Stack** พร้อมการควบคุมแบบเรียลไทม์ผ่าน MQTT, Admin Dashboard ที่สมบูรณ์, และระบบ Authentication ที่ปลอดภัย

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green)](https://supabase.com/)
[![MQTT](https://img.shields.io/badge/MQTT-HiveMQ-orange)](https://www.hivemq.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ✨ Features

### 🎯 Admin Dashboard
- 📊 **Real-time Monitoring** - Live charts และ widgets สำหรับข้อมูล sensor
- 🎛️ **Device Control** - ควบคุมอุปกรณ์ผ่าน MQTT (Switch, Slider, RGB, etc.)
- 🎨 **Device Customization** - ปรับแต่ง UI widgets แบบ No-Code (4 types: Switch, Slider, Gauge, Stat)
- 🔔 **Alert System** - แจ้งเตือนอัตโนมัติเมื่อเกินค่าที่กำหนด
- 👥 **User Management** - จัดการผู้ใช้และสิทธิ์ (Admin/User RBAC)
- 📈 **Data Analytics** - กราฟและสถิติแบบ real-time
- 🔧 **Device Settings** - กำหนดค่า threshold, sampling rate, alerts

### 🔐 Security & Authentication
- ✅ Supabase Authentication (Email/Password)
- ✅ Role-Based Access Control (Admin can manage all devices)
- ✅ Row Level Security (RLS) policies
- ✅ JWT-based middleware protection
- ✅ Input validation with Zod schemas
- ✅ HMAC-signed MQTT ingestion

### ⚡ Real-time Features
- 🔌 **MQTT Integration** - Subscribe/Publish ผ่าน HiveMQ Cloud
- 📡 **WebSocket Support** - Live data updates ไม่ต้อง refresh
- 🎮 **Interactive Widgets** - Optimistic UI + Debouncing
- 🔄 **Auto-reconnect** - MQTT connection recovery
- 📊 **Live Charts** - ApexCharts with streaming data

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui components |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Authentication** | Supabase Auth (JWT) |
| **Real-time** | MQTT (HiveMQ Cloud), Supabase Realtime |
| **Charts** | ApexCharts, Recharts |
| **State** | SWR, Zustand (toast) |
| **Forms** | React Hook Form + Zod validation |
| **Icons** | Lucide React (14 device icons) |

---

## 📁 Project Structure

```
iot-platform/
├── app/
│   ├── admin/                    # 🔒 Protected admin routes
│   │   ├── dashboard/           # 📊 Main dashboard
│   │   ├── devices/             # 📱 Device management (List/Widget view)
│   │   ├── control/             # 🎛️ Device control panel
│   │   ├── alerts/              # 🔔 Alert management
│   │   ├── users/               # 👥 User management (Admin only)
│   │   ├── settings/            # ⚙️ System settings
│   │   ├── login/               # 🔐 Login page
│   │   └── sign-up/             # ✍️ Registration
│   ├── api/
│   │   ├── auth/                # 🔑 Auth endpoints
│   │   ├── devices/             # 📱 Device CRUD + control
│   │   ├── mqtt/                # 📡 MQTT publish/ingest
│   │   ├── stats/               # 📈 System statistics
│   │   ├── alerts/              # 🔔 Alert endpoints
│   │   └── users/               # 👤 User management
│   ├── (public)/                # 🌍 Public pages
│   └── layout.tsx
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx          # 📑 Navigation
│   │   ├── topbar.tsx           # 🔝 Header with user menu
│   │   ├── charts/              # 📊 Chart components
│   │   ├── dialogs/             # 💬 Modal dialogs
│   │   └── widgets/             # 🎨 Device widgets
│   ├── ui/                      # 🎨 shadcn/ui components (42 components)
│   └── toast-container.tsx      # 🔔 Toast notifications
├── lib/
│   ├── supabase/                # 🗄️ DB client utilities
│   ├── mqtt/                    # 📡 MQTT client + hooks
│   ├── hooks/                   # ⚡ Custom React hooks
│   │   ├── useMqttControl.ts   # 🎮 MQTT control with debounce
│   │   ├── useToast.ts         # 🔔 Toast management
│   │   └── useIoTSystem.ts     # 🌐 Main IoT hook
│   ├── validators/              # ✅ Zod schemas
│   └── utils/                   # 🔧 Helper functions
├── scripts/                     # 📜 Database migrations
│   ├── 001_create_iot_schema.sql
│   ├── 002_create_profiles_trigger.sql
│   ├── 003_seed_iot_data.ts
│   ├── 004_add_mqtt_credentials.sql
│   ├── 005_add_user.sql
│   ├── 006_add_battery_to_sensor_data.sql
│   ├── 007_add_ui_config_to_devices.sql
│   └── 008_ensure_device_settings.sql
├── docs/                        # 📚 Documentation
│   ├── MQTT_CONTROL_GUIDE.md   # 🎮 MQTT control system
│   ├── DEVICE_CUSTOMIZATION.md # 🎨 Widget customization
│   ├── MQTT_INGEST.md          # 📡 Data ingestion
│   └── CONTROL_TROUBLESHOOTING.md
└── .env.local                   # 🔐 Environment variables
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Supabase account (free tier works)
- HiveMQ Cloud account (free tier available)

### 1️⃣ Installation

```bash
# Clone repository
git clone https://github.com/13EC4USE/iot.git
cd iot

# Install dependencies
npm install
# or
pnpm install --legacy-peer-deps
```

### 2️⃣ Environment Setup

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MQTT Configuration (HiveMQ Cloud)
NEXT_PUBLIC_MQTT_BROKER=wss://your-cluster.s1.eu.hivemq.cloud:8884/mqtt
NEXT_PUBLIC_MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX=iot-client-
NEXT_PUBLIC_MQTT_TOPIC_PREFIX=iot/

# MQTT Ingest Secret (for HMAC verification)
MQTT_INGEST_SECRET=your-secret-key-here
```

### 3️⃣ Database Setup

Run migrations in Supabase SQL Editor (in order):

```bash
# 1. Create schema and tables
scripts/001_create_iot_schema.sql

# 2. Create profile trigger
scripts/002_create_profiles_trigger.sql

# 3. Add MQTT credentials columns
scripts/004_add_mqtt_credentials.sql

# 4. Add battery level support
scripts/006_add_battery_to_sensor_data.sql

# 5. Add UI customization
scripts/007_add_ui_config_to_devices.sql

# 6. Ensure device settings
scripts/008_ensure_device_settings.sql
```

### 4️⃣ Seed Test Data (Optional)

```bash
# Using Node.js
npm run seed

# Or using ts-node
npx ts-node scripts/003_seed_iot_data.ts
```

### 5️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | foolkzaza@gmail.com | Your-Password |
| **User** | user@iot.com | User@123456 |

> **Note:** Admin can view/edit/delete ANY device. Regular users can only manage their own devices.

---

## 📡 MQTT Device Integration

### Publishing Sensor Data

**Topic Format:** `iot/{device_type}/{device_id}`

**Message Example:**
```json
{
  "id": "device-uuid",
  "value": 25.5,
  "temperature": 25.5,
  "humidity": 60,
  "battery": 85,
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

### Control Commands

**Subscribe to:** `iot/{device_type}/{device_id}`

**Command Examples:**
```json
// Switch Control
{
  "id": "device-uuid",
  "status": "on",
  "timestamp": "..."
}

// Slider/Dimmer Control
{
  "id": "device-uuid",
  "value": 75,
  "timestamp": "..."
}
```

See `docs/MQTT_CONTROL_GUIDE.md` for complete documentation.

---

## 🎨 Device Customization

### Widget Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Switch** | On/Off toggle with icon | Lights, Relays, Power control |
| **Slider** | Range slider (0-100) | Dimmers, Fan speed, Volume |
| **Gauge** | Circular progress gauge | Temperature, Humidity, Battery |
| **Stat** | Numeric display with icon | Counters, Measurements |

### Customization Options
- 🎨 **14 Icons** - Lightbulb, Fan, Lock, Thermometer, etc.
- 🌈 **8 Colors** - Blue, Green, Red, Yellow, Purple, Pink, Orange, Gray
- 📝 **Labels** - Custom name and unit display
- 👁️ **Live Preview** - See changes in real-time

**Usage:**
1. Go to Dashboard or Devices page
2. Click **Settings** button on device card
3. Choose widget type, icon, and color
4. Save and see instant UI update

See `docs/DEVICE_CUSTOMIZATION.md` for full guide.

---

## 📊 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/session` | Get current session |

### Devices
| Method | Endpoint | Description | Admin |
|--------|----------|-------------|-------|
| GET | `/api/devices` | List user's devices | View all |
| POST | `/api/devices` | Create device | ✅ |
| GET | `/api/devices/[id]` | Get device details | View any |
| PUT | `/api/devices/[id]` | Update device | Edit any |
| DELETE | `/api/devices/[id]` | Delete device | Delete any |
| POST | `/api/devices/[id]/control` | Control device | ✅ |
| GET | `/api/devices/[id]/data` | Get sensor data | ✅ |
| GET | `/api/devices/[id]/settings` | Get device settings | ✅ |
| PUT | `/api/devices/[id]/customize` | Update UI config | ✅ |

### MQTT
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mqtt/publish` | Publish MQTT message (authenticated) |
| POST | `/api/mqtt/ingest` | Ingest device data (HMAC signed) |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/summary` | System overview |
| GET | `/api/stats/traffic` | Message traffic |
| GET | `/api/stats/online-history` | Device online history |
| GET | `/api/stats/system-health` | System health metrics |
| GET | `/api/stats/message-rate` | Real-time message rate |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Get alerts (filterable) |
| PATCH | `/api/alerts/[id]` | Mark as read/unread |
| DELETE | `/api/alerts/[id]` | Delete alert |

### Users (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/[id]` | Get user details |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |

---

## 🗄️ Database Schema

### Core Tables

#### `users`
```sql
id              UUID PRIMARY KEY
email           TEXT UNIQUE
full_name       TEXT
role            TEXT (admin/user)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `devices`
```sql
id              UUID PRIMARY KEY
user_id         UUID FK -> users
name            TEXT
type            TEXT (temperature/humidity/light/motion/etc.)
location        TEXT
mac_address     TEXT
mqtt_topic      TEXT
mqtt_client_id  TEXT
is_active       BOOLEAN
power           BOOLEAN
battery_level   INTEGER
signal_strength INTEGER
ui_config       JSONB (widget customization)
last_update     TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `sensor_data`
```sql
id              UUID PRIMARY KEY
device_id       UUID FK -> devices
value           FLOAT
unit            TEXT
temperature     FLOAT
humidity        FLOAT
battery_level   INTEGER
timestamp       TIMESTAMP
created_at      TIMESTAMP
```

#### `device_alerts`
```sql
id              UUID PRIMARY KEY
device_id       UUID FK -> devices
type            TEXT (threshold_exceeded/device_offline/battery_low/error)
severity        TEXT (critical/warning/info)
message         TEXT
is_read         BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `device_settings`
```sql
id              UUID PRIMARY KEY
device_id       UUID FK -> devices (UNIQUE)
min_threshold   FLOAT
max_threshold   FLOAT
alert_enabled   BOOLEAN
update_interval INTEGER (seconds)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- **Users**: Can only view/edit their own data
- **Devices**: Users see only their devices; **Admin sees all**
- **Sensor Data**: Access based on device ownership
- **Alerts**: Access based on device ownership
- **Settings**: Access based on device ownership

---

## 💡 Usage Examples

### 1. Monitoring Devices
```typescript
// Real-time device monitoring
import { useIoTSystem } from '@/hooks/useIoTSystem'

function Dashboard() {
  const { devices, device, data, mqttStatus } = useIoTSystem()
  
  return (
    <div>
      <p>MQTT Status: {mqttStatus}</p>
      <p>Total Devices: {devices.length}</p>
      <p>Latest Reading: {data[0]?.value}</p>
    </div>
  )
}
```

### 2. Controlling Devices
```typescript
// Interactive device control
import { useMqttControl } from '@/lib/hooks/useMqttControl'

function DeviceControl({ device }) {
  const { toggleSwitch, setSliderValue, mqttConnected } = useMqttControl()
  
  const handleToggle = async () => {
    const success = await toggleSwitch(device, 'on')
    if (success) console.log('Device turned on!')
  }
  
  const handleSlider = (value: number) => {
    setSliderValue(device, value) // Debounced automatically
  }
  
  return (
    <>
      <button onClick={handleToggle}>Toggle</button>
      <input type="range" onChange={(e) => handleSlider(+e.target.value)} />
    </>
  )
}
```

### 3. Custom Widget
```typescript
// Create custom device widget
import { CustomDeviceWidget } from '@/components/admin/widgets/custom-device-widget'

function MyDevices() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {devices.map(device => (
        <CustomDeviceWidget
          key={device.id}
          device={device}
          onCustomize={() => openDialog(device)}
        />
      ))}
    </div>
  )
}
```

---

## 🔧 Advanced Configuration

### MQTT Settings
```env
# Adjust reconnection behavior
MQTT_RECONNECT_PERIOD=1000
MQTT_CONNECT_TIMEOUT=4000

# Topic structure
NEXT_PUBLIC_MQTT_TOPIC_PREFIX=iot/
# Results in: iot/temperature/bedroom-sensor
```

### Device Widget Customization
```json
// Stored in devices.ui_config (JSONB)
{
  "widgetType": "switch",
  "icon": "lightbulb",
  "color": "yellow",
  "label": "Bedroom Light",
  "unit": ""
}
```

### Alert Thresholds
```sql
-- Set per-device thresholds
UPDATE device_settings
SET min_threshold = 18,
    max_threshold = 28,
    alert_enabled = true
WHERE device_id = 'device-uuid';
```

---

## 🐛 Troubleshooting

### MQTT Connection Issues

**Problem:** "MQTT Disconnected" toast appears
```bash
# Check:
1. Verify MQTT_BROKER URL format: wss://...
2. Confirm credentials in .env.local
3. Check HiveMQ Cloud cluster status
4. Open browser console for detailed errors
```

**Solution:**
```typescript
// Test connection manually
import { initializeMqtt } from '@/lib/mqtt/client'

initializeMqtt()
// Check console for connection logs
```

### Authentication Issues

**Problem:** Redirect loop or "Unauthorized"
```bash
# Fix:
1. Clear browser cookies/cache
2. Verify JWT secret in Supabase
3. Check middleware.ts configuration
4. Ensure .env.local has correct keys
```

**Solution:**
```bash
# Reset auth state
localStorage.clear()
# Then login again
```

### Device Not Appearing

**Problem:** Created device doesn't show up
```bash
# Debug:
1. Check RLS policies in Supabase
2. Verify user_id matches current user
3. Ensure device.is_active = true
4. Check browser console for API errors
```

**Solution:**
```sql
-- Check device ownership
SELECT id, name, user_id 
FROM devices 
WHERE id = 'device-uuid';

-- Verify RLS policy
SELECT * FROM devices WHERE user_id = auth.uid();
```

### Build Errors

**Problem:** `Cannot find module` or type errors
```bash
# Fix dependencies
npm install
npm run build

# If persists:
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [MQTT_CONTROL_GUIDE.md](docs/MQTT_CONTROL_GUIDE.md) | Complete MQTT control implementation |
| [DEVICE_CUSTOMIZATION.md](docs/DEVICE_CUSTOMIZATION.md) | Widget customization guide |
| [MQTT_INGEST.md](docs/MQTT_INGEST.md) | Data ingestion endpoints |
| [CONTROL_TROUBLESHOOTING.md](docs/CONTROL_TROUBLESHOOTING.md) | Control panel debugging |

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub** (already done ✅)
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure environment variables

3. **Environment Variables**
   Add all `.env.local` variables to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_MQTT_BROKER`
   - `NEXT_PUBLIC_MQTT_USERNAME`
   - `MQTT_PASSWORD`
   - `MQTT_INGEST_SECRET`

4. **Deploy** 🎉
   ```
   Vercel will auto-deploy on every push to main
   ```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t iot-platform .
docker run -p 3000:3000 --env-file .env.local iot-platform
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run build
```

### Commit Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation update
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 IoT Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/13EC4USE/iot/issues)
- **Discussions:** [GitHub Discussions](https://github.com/13EC4USE/iot/discussions)
- **Email:** support@iot-platform.com
- **Documentation:** [docs/](docs/)

---

## 🌟 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [HiveMQ](https://www.hivemq.com/) - MQTT broker
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide Icons](https://lucide.dev/) - Icons

---

## 📈 Project Status

**Current Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 7, 2025

### Features Roadmap
- [x] Admin dashboard with real-time monitoring
- [x] MQTT device control with debouncing
- [x] Device customization (4 widget types)
- [x] Admin permissions (view/edit/delete all devices)
- [x] Toast notification system
- [x] Alert management
- [x] User management (RBAC)
- [ ] InfluxDB integration for time-series data
- [ ] WebRTC for video streaming
- [ ] Mobile app (React Native)
- [ ] AI-powered anomaly detection
- [ ] Advanced analytics dashboard

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

Made with 💙 by IoT Platform Team

[🏠 Homepage](https://iot-platform.com) • [📚 Docs](docs/) • [🐛 Report Bug](https://github.com/13EC4USE/iot/issues) • [✨ Request Feature](https://github.com/13EC4USE/iot/issues)

</div>
\`\`\`

Now I'll create a quick start guide:
