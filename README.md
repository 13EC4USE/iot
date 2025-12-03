# IoT Web Platform - Smart Device Management System

ระบบจัดการอุปกรณ์ IoT แบบเต็มรูปแบบพร้อมการตรวจสอบสิทธิ์, การควบคุมแบบเรียลไทม์, และแดชบอร์ด

## Features

### Public Website
- Landing page with feature showcase
- Pricing page with subscription tiers
- About page with company information
- Contact page for inquiries
- Blog section for IoT articles

### Admin Dashboard
- Real-time device monitoring with charts
- Device management (CRUD operations)
- Remote device control via MQTT
- Sensor data visualization
- Alert management system
- User management with RBAC
- System settings and configuration
- API key generation

### Security
- Supabase authentication with email/password
- Role-based access control (Admin/User)
- Row Level Security (RLS) on database
- Middleware-based route protection
- Input validation with Zod schemas
- Rate limiting support (optional)

### Real-time Features
- MQTT subscriptions for device data
- Supabase real-time database subscriptions
- Live sensor data updates
- Alert notifications

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **IoT Protocol**: MQTT (HiveMQ Cloud)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Data Fetching**: SWR
- **Validation**: Zod
- **UI Components**: shadcn/ui

## Project Structure

\`\`\`
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── devices/
│   │   ├── control/
│   │   ├── users/
│   │   ├── settings/
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── devices/
│   │   ├── users/
│   │   └── alerts/
│   ├── (public)/
│   │   ├── home
│   │   ├── about
│   │   ├── pricing
│   │   ├── features
│   │   ├── blog
│   │   └── contact
│   ├── page.tsx (home)
│   ├── layout.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── ...
│   ├── skeletons/
│   ├── error-boundary.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── ...
│   ├── mqtt/
│   │   ├── mqtt-service.ts
│   │   ├── mqtt-hooks.ts
│   │   └── ...
│   ├── validators/
│   │   └── schemas.ts
│   ├── hooks/
│   ├── api/
│   ├── rate-limit/
│   └── env/
├── scripts/
│   ├── 001_create_iot_schema.sql
│   ├── 002_create_profiles_trigger.sql
│   └── 003_seed_iot_data.ts
├── proxy.js (Middleware)
└── package.json
\`\`\`

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- HiveMQ Cloud account

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_key
   NEXT_PUBLIC_MQTT_BROKER=wss://your-broker.cloud.hivemq.com:8884
   NEXT_PUBLIC_MQTT_USERNAME=your_user
   NEXT_PUBLIC_MQTT_PASSWORD=your_pass
   \`\`\`

4. Run database migrations:
   - Open Supabase SQL editor
   - Execute: `scripts/001_create_iot_schema.sql`
   - Execute: `scripts/002_create_profiles_trigger.sql`

5. Seed test data:
   \`\`\`bash
   npx ts-node scripts/003_seed_iot_data.ts
   \`\`\`

6. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Test Credentials

- **Admin**: admin@iot.com / Admin@123456
- **User**: user@iot.com / User@123456

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Devices
- `GET /api/devices` - Get all user devices
- `POST /api/devices` - Create new device
- `GET /api/devices/[id]` - Get device details
- `PUT /api/devices/[id]` - Update device
- `DELETE /api/devices/[id]` - Delete device
- `POST /api/devices/[id]/control` - Control device
- `GET /api/devices/[id]/data` - Get sensor data

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]/delete` - Delete user

### Alerts
- `GET /api/alerts` - Get alerts
- `POST /api/alerts` - Create alert

See `docs/MQTT_INGEST.md` for details on the MQTT ingest endpoints and recommended usage (`/api/mqtt/ingest` and `/api/mqtt/ingest/proxy`).

## Database Schema

### users
- id (UUID)
- email (String)
- full_name (String)
- role (admin/user)
- created_at, updated_at

### devices
- id (UUID)
- user_id (FK)
- name, type, location
- mac_address, mqtt_topic
- is_active, power
- battery_level, signal_strength
- last_update, created_at, updated_at

### sensor_data
- id (UUID)
- device_id (FK)
- value, unit
- temperature, humidity
- timestamp, created_at

### device_alerts
- id (UUID)
- device_id (FK)
- type, severity, message
- is_read
- created_at, updated_at

### device_settings
- id (UUID)
- device_id (FK)
- min_threshold, max_threshold
- alert_enabled
- update_interval

## Features & Usage

### Monitoring Devices
1. Go to Dashboard to see real-time status
2. Charts show temperature and humidity data
3. Alerts appear when thresholds are exceeded

### Controlling Devices
1. Go to Device Control page
2. Select a device
3. Use controls to power on/off or change settings
4. Commands are sent via MQTT

### Managing Users
1. Admin can view all users in Users page
2. Change user roles (Admin/User)
3. Delete users if needed

### System Settings
1. Configure alert thresholds
2. Set data retention period
3. Generate API keys for integrations

## Code Formatting

Format all code:
\`\`\`bash
npm run format
\`\`\`

Check formatting:
\`\`\`bash
npm run format:check
\`\`\`

## Deployment

Deploy to Vercel:
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

Add environment variables in Vercel dashboard.

## Troubleshooting

### MQTT Connection Issues
- Check broker URL format (should be wss://)
- Verify credentials
- Ensure HiveMQ cluster is active

### Authentication Issues
- Clear browser cache
- Check JWT secret in Supabase
- Verify middleware configuration

### Database Issues
- Run migrations again
- Check RLS policies
- Verify service role key

## Contributing

Contributions are welcome! Please follow the coding standards and submit PRs.

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, open an issue or contact support.

---

Built with Next.js, Supabase, and MQTT for IoT excellence.
\`\`\`

Now I'll create a quick start guide:
