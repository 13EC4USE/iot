# 📋 สรุประบบ IoT - ระบบเว็บและ Raspberry Pi พร้อมใช้งาน

## ✅ สถานะปัจจุบัน

### 1. ไฟล์ที่เตรียมไว้บน Windows (d:\io-t-webpage (2)\)

#### Python Scripts สำหรับ Raspberry Pi:
- ✅ `data_logger_updated.py` - MQTT subscriber บันทึก CSV + Supabase
- ✅ `config_manager_pi.py` - Flask API บริหารจัดการ config (port 5000)
- ✅ `iot_config.json` - ไฟล์ config สำหรับ device mapping

#### Shell Scripts สำหรับทดสอบ:
- ✅ `test_mqtt_to_supabase.sh` - สคริปต์ทดสอบ pipeline
- ✅ `setup_pi.sh` - สคริปต์ติดตั้งระบบบน Pi

#### Documentation:
- ✅ `TESTING_GUIDE.md` - คู่มือทดสอบระบบทีละขั้นตอน
- ✅ `COPY_TO_PI.md` - วิธี copy ไฟล์จาก Windows ไป Pi
- ✅ `SYSTEM_SUMMARY.md` - เอกสารนี้

### 2. Web Dashboard (Next.js)
- ✅ `/admin/device-config` - หน้าจัดการ device configuration
- ✅ `/admin/mqtt-config` - หน้าตั้งค่า MQTT
- ✅ `/api/iot-config` - API gateway ไปหา Pi
- ⚠️ `/admin/telemetry` - ปิดการใช้งาน (WebSocket issues)

### 3. ESP32 Firmware
- ✅ มีโค้ดพร้อมใช้ที่ `c:\Users\admin\Desktop\mq_137_deepsleepdebug\`
- ⏳ **ยังไม่ได้อัปโหลดไป ESP32** (รอให้ระบบเว็บและ Pi พร้อม)

---

## 🔄 สถาปัตยกรรมระบบ

```
[ESP32 MQ-137 + DHT22]
         ↓ MQTT publish
   iot/Station_1/ammonia
         ↓
[Raspberry Pi - 192.168.1.142:1883]
  ├─ Mosquitto Broker (port 1883)
  ├─ Config Manager (port 5000) ← Web Dashboard
  └─ Data Logger Script
         ├→ sensor_data.csv (local backup)
         └→ Supabase sensor_data table (cloud)
              ↑
    [Web Dashboard - View Only]
```

---

## 📦 ข้อมูล Configuration

### MQTT Settings:
- **Broker:** 192.168.1.142
- **Port:** 1883 (plain MQTT, no WebSocket)
- **Topic:** `iot/Station_1/ammonia`

### Device Mapping:
- **Device ID:** Station_1
- **UUID:** 46588dc3-c4d1-4269-b626-90116c8b97a4

### Supabase:
- **URL:** https://gninseyojtjnfonoerve.supabase.co
- **Table:** sensor_data
- **RLS:** Enabled (anon role has SELECT/INSERT/UPDATE/DELETE)

### JSON Payload Format (จาก ESP32):
```json
{
  "id": "Station_1",
  "ammonia": 25.5,
  "temperature": 28.5,
  "humidity": 65.2,
  "calibratedRo": 10.0,
  "timestamp": "12:30:45"
}
```

---

## 🚀 ขั้นตอนถัดไป (To-Do)

### Phase 1: Setup Raspberry Pi ✨ URGENT
1. **Copy ไฟล์จาก Windows ไป Pi:**
   ```bash
   # จาก Windows PowerShell
   scp data_logger_updated.py pi@192.168.1.142:/home/pi/io-t-webpage/
   scp config_manager_pi.py pi@192.168.1.142:/home/pi/io-t-webpage/
   scp iot_config.json pi@192.168.1.142:/home/pi/io-t-webpage/
   scp setup_pi.sh pi@192.168.1.142:/home/pi/io-t-webpage/
   ```

2. **SSH เข้า Pi และรันติดตั้ง:**
   ```bash
   ssh pi@192.168.1.142
   cd /home/pi/io-t-webpage
   chmod +x setup_pi.sh
   ./setup_pi.sh
   ```

3. **ตรวจสอบว่าทุกอย่างรัน:**
   ```bash
   sudo systemctl status mosquitto
   sudo systemctl status iot-config-manager
   sudo systemctl status iot-data-logger
   ```

### Phase 2: ทดสอบระบบบน Pi
1. **ทดสอบ MQTT:**
   ```bash
   cd /home/pi/io-t-webpage
   ./test_mqtt_to_supabase.sh
   ```

2. **ตรวจสอบ CSV:**
   ```bash
   tail -n 5 sensor_data.csv
   ```

3. **ตรวจสอบ Supabase:**
   - เปิด https://gninseyojtjnfonoerve.supabase.co
   - ไปที่ Table Editor → sensor_data
   - ต้องเห็นข้อมูลทดสอบ

### Phase 3: ESP32 Integration (หลังจากระบบพร้อม)
1. **ทบทวนโค้ด ESP32:**
   - ตรวจสอบว่ามีการ publish ไป `iot/Station_1/ammonia`
   - ตรวจสอบว่า payload format ตรงกับที่ data logger คาดหวัง

2. **อัปโหลดไป ESP32:**
   - Arduino IDE → Upload
   - เปิด Serial Monitor (115200 baud)
   - ดูว่าเชื่อมต่อ WiFi และ MQTT สำเร็จ

3. **ทดสอบ End-to-End:**
   - ESP32 ส่งข้อมูล → Pi Mosquitto → Data Logger → CSV + Supabase
   - ตรวจสอบทุกจุด

### Phase 4: Web Dashboard Testing
1. **ทดสอบ Config API:**
   - เปิด http://localhost:3000/admin/device-config
   - ทดสอบ Add/Edit/Delete device
   - ดูว่าเชื่อมต่อ Pi API (port 5000) ได้

2. **ดูข้อมูลใน Supabase:**
   - ใช้ web dashboard ดูข้อมูลจาก table sensor_data

---

## 🔧 Quick Reference Commands

### บน Windows:
```powershell
# รัน web dashboard
cd "d:\io-t-webpage (2)"
npm run dev
# เปิด http://localhost:3000
```

### บน Raspberry Pi:
```bash
# ดู logs
journalctl -u iot-data-logger -f
journalctl -u iot-config-manager -f

# รีสตาร์ทบริการ
sudo systemctl restart iot-data-logger
sudo systemctl restart iot-config-manager
sudo systemctl restart mosquitto

# ทดสอบ MQTT
mosquitto_pub -h 192.168.1.142 -p 1883 \
  -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":20.0,"temperature":25.0,"humidity":60.0,"calibratedRo":10.0,"timestamp":"10:00:00"}'

# ดู CSV
tail -f sensor_data.csv
```

---

## 📊 System Health Checklist

สถานะที่ต้องเป็น ✅ ก่อนใช้งานจริง:

### บน Raspberry Pi:
- [ ] Mosquitto running (port 1883)
- [ ] `iot-config-manager` service running (port 5000)
- [ ] `iot-data-logger` service running
- [ ] ไฟล์ `iot_config.json` มีข้อมูล Station_1
- [ ] ทดสอบ MQTT pub/sub สำเร็จ
- [ ] ทดสอบ CSV logging สำเร็จ
- [ ] ทดสอบ Supabase upload สำเร็จ

### บน Windows (Web Dashboard):
- [ ] Next.js server running (npm run dev)
- [ ] เปิด /admin/device-config ได้
- [ ] เชื่อมต่อ Pi API (http://192.168.1.142:5000) ได้
- [ ] ดึงข้อมูลจาก Supabase ได้

### ESP32:
- [ ] โค้ดคอมไพล์ผ่าน (no errors)
- [ ] Upload ไป ESP32 สำเร็จ
- [ ] WiFi เชื่อมต่อสำเร็จ
- [ ] MQTT publish สำเร็จ
- [ ] ข้อมูลปรากฏใน CSV และ Supabase

---

## 🎯 Current Status: Web + Pi Ready, Waiting for ESP32 Test

**ทำไปแล้ว:**
- ✅ Data logger script พร้อม
- ✅ Config manager API พร้อม
- ✅ Config file พร้อม
- ✅ Testing scripts พร้อม
- ✅ Documentation พร้อม
- ✅ Web dashboard พร้อม

**ขั้นตอนถัดไป:**
1. Copy ไฟล์ไป Pi
2. รัน setup_pi.sh
3. ทดสอบระบบบน Pi
4. อัปโหลด ESP32 (เมื่อระบบพร้อม)

---

**📝 หมายเหตุ:** ระบบออกแบบให้ทำงานแบบ backend-only (ไม่มี WebSocket) เพื่อความเรียบง่าย - Web dashboard ใช้สำหรับ config management และ view historical data เท่านั้น
