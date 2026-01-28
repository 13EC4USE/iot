# Script to add multiple IoT stations to the system

This directory contains scripts to help you add multiple stations (Station_2, Station_3, etc.) to your IoT ammonia monitoring system.

## Quick Setup for New Station

### 1. Add Device to Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Add Station_2 (repeat for Station_3, Station_4, etc.)
INSERT INTO devices (
  id,
  user_id,
  name,
  type,
  location,
  mac_address,
  mqtt_topic,
  is_active,
  power,
  battery_level,
  signal_strength,
  last_update
) VALUES (
  'YOUR-UUID-HERE',  -- Generate new UUID or let it auto-generate
  (SELECT id FROM auth.users WHERE email = 'admin@iot.com' LIMIT 1),  -- Use your user
  'Station 2 - Ammonia Sensor',
  'ammonia',
  'Location 2',
  'ESP32-Station2',
  'iot/Station_2/ammonia',
  true,
  true,
  100,
  85,
  NOW()
) RETURNING id;
```

### 2. Update Pi Configuration

Add to `/home/admin/io-t-webpage/iot_config.json` on Raspberry Pi:

```json
{
  "devices": {
    "Station_1": {
      "device_id": "Station_1",
      "broker": "192.168.1.142",
      "port": 1883,
      "topic_prefix": "iot/",
      "enabled": true,
      "uuid": "46588dc3-c4d1-4269-b626-90116c8b97a4",
      "last_updated": "2025-01-20T00:00:00"
    },
    "Station_2": {
      "device_id": "Station_2",
      "broker": "192.168.1.142",
      "port": 1883,
      "topic_prefix": "iot/",
      "enabled": true,
      "uuid": "YOUR-STATION2-UUID-HERE",
      "last_updated": "2025-01-21T00:00:00"
    }
  },
  "mqtt": {
    "broker": "192.168.1.142",
    "port": 1883,
    "use_auth": false
  }
}
```

### 3. Restart Pi Data Logger

```bash
sudo systemctl restart iot-data-logger
sudo systemctl status iot-data-logger
```

### 4. Upload ESP32 Code

Modify `mq_137_deepsleepdebug_pi_local.ino`:

```cpp
// Change DEVICE_ID for each station
const char* DEVICE_ID = "Station_2";  // Station_1, Station_2, Station_3, etc.
```

Upload to ESP32.

## Node.js Script to Add Station

```javascript
// scripts/add_new_station.cjs
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addStation(stationNumber, location = null) {
  const stationId = `Station_${stationNumber}`
  
  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)

  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id: users[0].id,
      name: `${stationId} - Ammonia Sensor`,
      type: 'ammonia',
      location: location || `Location ${stationNumber}`,
      mac_address: `ESP32-${stationId}`,
      mqtt_topic: `iot/${stationId}/ammonia`,
      is_active: true,
      power: true,
      battery_level: 100,
      signal_strength: 85
    })
    .select()
    .single()

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log(`✅ ${stationId} created!`)
    console.log(`UUID: ${data.id}`)
    console.log(`\nAdd to Pi iot_config.json:`)
    console.log(`"${stationId}": {`)
    console.log(`  "device_id": "${stationId}",`)
    console.log(`  "broker": "192.168.1.142",`)
    console.log(`  "port": 1883,`)
    console.log(`  "topic_prefix": "iot/",`)
    console.log(`  "enabled": true,`)
    console.log(`  "uuid": "${data.id}",`)
    console.log(`  "last_updated": "${new Date().toISOString()}"`)
    console.log(`}`)
  }
}

// Usage: node scripts/add_new_station.cjs
addStation(2, 'Farm Area A')
```

## Testing New Station

1. **Test MQTT Publishing** from Pi:
```bash
mosquitto_pub -h 192.168.1.142 -t "iot/Station_2/ammonia" -m '{"id":"Station_2","ammonia":15.5,"temperature":28,"humidity":65,"calibratedRo":10.2,"timestamp":"2026-01-21T10:30:00"}'
```

2. **Check Logs**:
```bash
journalctl -u iot-data-logger -f
tail -f /home/admin/io-t-webpage/sensor_data.csv
```

3. **Verify Supabase**:
```sql
SELECT * FROM sensor_data 
WHERE station_id = 'Station_2' 
ORDER BY timestamp DESC 
LIMIT 5;
```

4. **Check Web Dashboard**:
   - Go to http://localhost:3000/admin/dashboard
   - Should see Station_2 in device list
   - Data should update every 10 seconds

## Bulk Add Multiple Stations

```javascript
// Add Stations 2-10
for (let i = 2; i <= 10; i++) {
  await addStation(i, `Farm Section ${String.fromCharCode(64 + i)}`)
  await new Promise(r => setTimeout(r, 1000)) // Wait 1 second between each
}
```

## Monitoring All Stations

Dashboard automatically shows all devices. For custom views:

1. **By Station Type**:
```javascript
const { data } = await supabase
  .from('devices')
  .select('*')
  .eq('type', 'ammonia')
  .order('name')
```

2. **Latest Data from All Stations**:
```javascript
const { data } = await supabase
  .from('sensor_data')
  .select('station_id, ammonia_ppm, temperature, humidity, timestamp')
  .order('timestamp', { ascending: false })
  .limit(1)
```

## Troubleshooting

- **Station not appearing**: Check iot_config.json UUID matches device ID in Supabase
- **No data**: Verify MQTT topic format: `iot/Station_X/ammonia`
- **Wrong data**: Check ESP32 DEVICE_ID constant matches station name
