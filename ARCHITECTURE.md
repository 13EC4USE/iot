# Architecture Documentation

## System Overview

\`\`\`
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────┐
│   Next.js Frontend      │
│  - React Components     │
│  - Tailwind CSS         │
│  - SWR for data fetch   │
└────────┬────────────────┘
         │ API Calls
         ▼
┌─────────────────────────┐
│  API Routes             │
│  - Authentication       │
│  - Device Management    │
│  - User Management      │
│  - Data Handling        │
└────────┬────────────────┘
         │
    ┌────┴─────┬────────────┐
    │           │            │
    ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Supabase│ │Supabase│ │HiveMQ    │
│  Auth  │ │   DB   │ │Cloud MQTT│
└────────┘ └────────┘ └──────────┘
                           │
                           ▼
                      ┌─────────────┐
                      │  ESP32/IoT  │
                      │  Devices    │
                      └─────────────┘
\`\`\`

## Authentication Flow

1. User submits login credentials
2. Supabase validates credentials
3. JWT token issued
4. Token stored in secure cookie
5. Middleware verifies token
6. User redirected to dashboard

## MQTT Communication

1. Frontend subscribes to device topics
2. MQTT client connects to HiveMQ
3. Receives device data
4. Data sent to Supabase
5. Dashboard updates in real-time

## Real-time Subscriptions

1. Supabase client subscribes to table changes
2. When data changes, event emitted
3. Frontend components update automatically
4. No need for manual refresh

## Security Architecture

\`\`\`
┌──────────────────────────────────────┐
│  Supabase Authentication             │
│  - Email/Password                    │
│  - JWT Token Management              │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Row Level Security (RLS)            │
│  - Users see only own data           │
│  - Admins see all data               │
│  - API enforces RLS                  │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  API Route Protection                │
│  - Middleware verification           │
│  - Authorization checks              │
│  - Input validation                  │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Rate Limiting (Optional)            │
│  - Prevent abuse                     │
│  - Upstash Redis integration         │
└──────────────────────────────────────┘
\`\`\`

## Data Flow

### Device Data Ingestion
\`\`\`
ESP32 Device
    │
    │ MQTT Publish
    ▼
HiveMQ Cloud
    │
    │ WebSocket
    ▼
Browser (MQTT Client)
    │
    │ API Call
    ▼
Next.js API Route
    │
    │ Validate & Process
    ▼
Supabase Database
    │
    │ Real-time Notification
    ▼
Dashboard Component (Updates)
\`\`\`

### User Actions
\`\`\`
User Interaction
    │
    ▼
React Component
    │
    │ Validation
    ▼
API Route
    │
    │ Authorization Check
    ▼
Database Operation
    │
    │ Return Result
    ▼
Component Update
\`\`\`

## Database Design

### Normalization Strategy
- Users: Store user profile and role
- Devices: One-to-many with users
- Sensor_data: Time-series data per device
- Device_alerts: Alert history per device
- Device_settings: Configuration per device

### Indexes
- devices(user_id) - Fast user device lookup
- sensor_data(device_id) - Fast data queries
- sensor_data(timestamp) - Time-range queries
- device_alerts(device_id) - Alert lookups

### Partitioning (Optional)
For production with large datasets:
- Partition sensor_data by time
- Archive old data
- Implement data retention policy

## Performance Optimization

1. **SWR Caching**: Reduce API calls
2. **Real-time Subscriptions**: Live updates
3. **Skeleton Loading**: Better UX
4. **Lazy Loading**: Component splitting
5. **Image Optimization**: Next.js Image
6. **Database Indexes**: Query performance

## Scalability Considerations

1. **Horizontal Scaling**: Deploy multiple instances
2. **CDN**: Cache static assets
3. **Database**: Supabase auto-scales
4. **MQTT**: HiveMQ handles connections
5. **Rate Limiting**: Protect against abuse
6. **Caching**: Redis for session data

## Monitoring & Logging

1. **Application Logs**: Console and browser
2. **Error Tracking**: Error boundaries
3. **Performance**: Next.js analytics
4. **Database**: Supabase monitoring
5. **MQTT**: HiveMQ dashboard

## Deployment Architecture

\`\`\`
GitHub Repository
    │
    │ Push to main
    ▼
Vercel CI/CD
    │
    │ Build & Test
    ▼
Edge Network
    │
    ├─ API Routes
    ├─ Static Files
    └─ Serverless Functions
         │
         ▼
    Supabase & HiveMQ
\`\`\`

---

For more details, see individual component documentation.
