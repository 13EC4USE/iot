# Quick Start Guide

## 5-Minute Setup

### 1. Environment Setup
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your credentials
\`\`\`

### 2. Database Setup
\`\`\`bash
# Run in Supabase SQL Editor:
scripts/001_create_iot_schema.sql
scripts/002_create_profiles_trigger.sql
\`\`\`

### 3. Seed Data
\`\`\`bash
npx ts-node scripts/003_seed_iot_data.ts
\`\`\`

### 4. Start Server
\`\`\`bash
npm install
npm run dev
\`\`\`

### 5. Access Application
- **Public Site**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin/login
- **Test Credentials**: admin@iot.com / Admin@123456

## Key Features to Try

1. **Dashboard**: View real-time device metrics
2. **Device Management**: Add/edit/delete IoT devices
3. **Device Control**: Send MQTT commands
4. **User Management**: Manage admin users
5. **Alerts**: Setup and monitor alerts

## HiveMQ Cloud Setup

1. Create account at hivemq.com
2. Create new cluster
3. Generate username/password
4. Copy broker URL (wss://...)
5. Update .env.local

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MQTT not connecting | Check broker URL and credentials |
| Database empty | Run seed script |
| Login fails | Clear cache, check Supabase keys |
| Charts not showing | Wait 30 seconds for data |

## Next Steps

- Configure alert thresholds in Settings
- Create additional devices
- Connect real ESP32 devices
- Setup custom MQTT topics
- Customize UI colors/branding

---

For full setup guide, see COMPLETE_SETUP.md
