# IoT Web Platform - Complete Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- HiveMQ Cloud account

## Installation

### 1. Clone and Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MQTT - HiveMQ Cloud
NEXT_PUBLIC_MQTT_BROKER=wss://your-hivemq-broker.cloud.hivemq.com:8884
NEXT_PUBLIC_MQTT_USERNAME=your_mqtt_username
NEXT_PUBLIC_MQTT_PASSWORD=your_mqtt_password

# Optional: Redis for rate limiting
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
\`\`\`

### 3. Database Setup

Run the migration scripts to create tables:

\`\`\`bash
# Note: Run these in Supabase SQL editor
scripts/001_create_iot_schema.sql
scripts/002_create_profiles_trigger.sql
\`\`\`

### 4. Seed Test Data

\`\`\`bash
npx ts-node scripts/003_seed_iot_data.ts
\`\`\`

## Running the Application

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

\`\`\`bash
npm run build
npm run start
\`\`\`

## Test Credentials

- **Admin Email**: admin@iot.com
- **Admin Password**: Admin@123456
- **User Email**: user@iot.com
- **User Password**: User@123456

## Features

### Public Website
- Home page with features showcase
- Pricing page
- About page
- Contact page

### Admin Dashboard
- **Login/Sign Up**: Supabase authentication
- **Dashboard**: Real-time device monitoring with charts
- **Device Management**: CRUD operations for IoT devices
- **Device Control**: Remote control and monitoring
- **User Management**: Manage users and roles
- **Settings**: Configuration options

### Real-time Features
- MQTT subscriptions for device data
- Supabase real-time database subscriptions
- Live sensor data updates
- Alert notifications

### Security
- Row Level Security (RLS) on all tables
- Authentication middleware
- Input validation with Zod
- Rate limiting (optional with Redis)

## HiveMQ Cloud Setup

1. Create a HiveMQ Cloud account
2. Create a cluster
3. Generate a username and password
4. Get your broker URL (should be `wss://` format)
5. Update `.env.local` with the credentials

## API Routes

- `POST /api/auth/login` - User login
- `GET /api/devices` - Get user's devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/[id]` - Update device
- `POST /api/devices/[id]/control` - Control device
- `GET /api/devices/[id]/data` - Get sensor data
- `POST /api/alerts` - Create alert
- `GET /api/stats` - Get system statistics

## Code Formatting

Format code with Prettier:

\`\`\`bash
npm run format       # Format all files
npm run format:check # Check formatting
\`\`\`

## Troubleshooting

### MQTT Connection Issues
- Verify broker URL format (should include wss://)
- Check username and password
- Ensure HiveMQ cluster is running

### Supabase Issues
- Verify API URL and keys in `.env.local`
- Check RLS policies in Supabase dashboard
- Ensure tables are created with migrations

### Authentication Issues
- Clear browser cookies
- Check Supabase JWT secret
- Verify middleware is in place

## Deployment

Deploy to Vercel:

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

Add environment variables in Vercel dashboard under Project Settings > Environment Variables.

## Support

For issues or questions, check the documentation or create an issue in the repository.
