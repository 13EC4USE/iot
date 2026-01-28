# ⚙️ Option 3: Pi Proxy Configuration System

## 🎯 Overview
Configuration ผ่าน Web Dashboard/Raspberry Pi แทนการแก้ code ที่ ESP32

```
Web Dashboard (/admin/device-config)
    ↓ REST API
Next.js Server (/api/iot-config)
    ↓ Forward request
Raspberry Pi (config_manager.py:5000)
    ↓ Save to JSON
Pi: iot_config.json
    ↓ Read config
data_logger.py
    ↓ Connect to broker
MQTT Broker (Mosquitto)
    ↓ Receive messages
ESP32 (ไม่ต้องแก้ code!)
```

---

## 🚀 Installation on Raspberry Pi

### Step 1: Install Flask (ถ้ายังไม่มี)
```bash
pip install flask
```

### Step 2: Copy config manager script
วาง `config_manager_pi.py` ไปยัง Raspberry Pi
```bash
scp config_manager_pi.py pi@192.168.1.142:~/
```

### Step 3: Copy updated data logger
วาง `data_logger_updated.py` ไปยัง Raspberry Pi
```bash
scp data_logger_updated.py pi@192.168.1.142:~/data_logger.py
```

### Step 4: Run config manager
```bash
python3 config_manager_pi.py
```

Output:
```
🚀 IoT Config Manager Starting...
📁 Config file: iot_config.json
🔗 API Endpoint: http://localhost:5000/api/config
💡 Health check: http://localhost:5000/health
--------------------------------------------------
```

### Step 5: Verify config file was created
```bash
cat iot_config.json
```

Expected output:
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
      "last_updated": "..."
    }
  },
  "mqtt": {
    "broker": "192.168.1.142",
    "port": 1883,
    "use_auth": false,
    "username": "",
    "password": ""
  },
  "local_logging": {
    "csv_file": "sensor_data.csv",
    "enable_csv": true,
    "enable_supabase": true
  }
}
```

---

## 🌐 Set up on Web Dashboard

### Step 1: Update .env.local
```env
# ตั้ง URL ของ Pi config manager
PI_CONFIG_URL=http://192.168.1.142:5000
```

### Step 2: Restart web server
```bash
npm run dev
```

### Step 3: Go to Device Config page
- URL: `http://localhost:3000/admin/device-config`
- เข้าไป Admin Dashboard
- คลิก "⚙️ ตั้งค่าอุปกรณ์" ในเมนู

---

## 💻 Using Web UI

### View Current Config
- Dashboard แสดง status Pi connection
- แสดง MQTT broker settings ปัจจุบัน
- แสดง devices ที่กำหนดไว้

### Update MQTT Broker Settings
1. แก้ไข Broker Address, Port
2. ถ้า use auth → เติม username/password
3. คลิก "💾 Save MQTT Config"
4. Pi config file อัปเดต → data logger อ่านใหม่ (ต้อง restart)

### Add New Device
1. คลิก "➕ Add Device"
2. ใส่:
   - Device ID: `Station_1`, `Station_2`, etc.
   - Database UUID: UUID จาก Supabase
   - Broker: (inherit from MQTT settings)
   - Port: (inherit from MQTT settings)
3. คลิก "✅ Add Device"
4. Device เก็บไปยัง `iot_config.json`

### Delete Device
- คลิก "🗑️ Delete" ที่ rows ที่ต้องการ
- Confirm
- Device ลบจาก config

---

## 🔄 Full Workflow

### Scenario: Add New Station

1. **Web Dashboard:**
   - Go to `/admin/device-config`
   - Click "➕ Add Device"
   - Enter: `Station_2`, UUID, broker IP, port 1883
   - Click "✅ Add Device"

2. **Behind the Scenes:**
   - Web → REST call to `/api/iot-config?action=device&device_id=Station_2` (POST)
   - Next.js → Forward to Pi: `http://192.168.1.142:5000/api/config/device/Station_2`
   - Pi config_manager → Save to `iot_config.json`

3. **Restart data logger (on Pi):**
   ```bash
   # Stop old logger
   Ctrl+C
   
   # Start new logger
   python3 data_logger.py
   ```
   
   Output:
   ```
   ✅ Config loaded from iot_config.json
      Broker: 192.168.1.142:1883
      Devices: ['Station_1', 'Station_2']
   ```

4. **ESP32 keeps working as-is:**
   - No code changes needed
   - Sends data to old topic `sensors/ammonia`
   - Pi normalizer converts to new format (future enhancement)

---

## ✅ Verification Checklist

- [ ] config_manager_pi.py running on Pi (port 5000)
- [ ] `iot_config.json` file exists on Pi
- [ ] `.env.local` has `PI_CONFIG_URL=http://192.168.1.142:5000`
- [ ] Web dashboard shows "🟢 Connected" to Pi
- [ ] Can add/edit/delete devices from Web UI
- [ ] data_logger.py restarts successfully with new config
- [ ] Data logger reads MQTT config from file (not hardcoded)

---

## 🐛 Troubleshooting

### Pi config manager won't start
```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process on port 5000
kill -9 <PID>
```

### Web dashboard can't connect to Pi
```bash
# From web server, test Pi connection
curl http://192.168.1.142:5000/health

# If fails, check:
# 1. Pi IP address is correct
# 2. Firewall allows port 5000
# 3. Both on same network
```

### Config changes not taking effect
```bash
# Restart data logger on Pi
ps aux | grep data_logger
kill <PID>
python3 data_logger.py
```

### iot_config.json missing
```bash
# Start config_manager with -reset flag
python3 config_manager_pi.py
# This will create default config on first run
```

---

## 📡 API Reference (Advanced)

### Get All Config
```bash
curl http://192.168.1.142:5000/api/config
```

### Get Device
```bash
curl http://192.168.1.142:5000/api/config/device/Station_1
```

### Update Device
```bash
curl -X POST http://192.168.1.142:5000/api/config/device/Station_1 \
  -H "Content-Type: application/json" \
  -d '{"broker":"192.168.1.100","port":1883}'
```

### Add/Update via Web API
```bash
curl http://localhost:3000/api/iot-config?action=devices
curl http://localhost:3000/api/iot-config?action=device&device_id=Station_1
```

---

## 🎁 Benefits

✅ **No ESP32 Code Changes** - Keep ESP32 firmware as-is  
✅ **Dynamic Configuration** - Change settings without uploading to devices  
✅ **Web UI Management** - User-friendly dashboard  
✅ **Scalable** - Add/remove devices easily  
✅ **Remote Update** - Update config from anywhere on network  
✅ **Version Control** - Config stored in JSON (can track changes)  

---

## 📝 Next Steps

1. Run config manager on Pi
2. Update web .env.local with PI_CONFIG_URL
3. Restart web server
4. Go to Device Config page and test adding a device
5. Restart data logger to load new config
6. Monitor with `/admin/telemetry` page

**ESP32 stays unchanged! ✨**
