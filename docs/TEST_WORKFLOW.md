# 🧪 วิธีทดสอบระบบ IoT ผ่าน Raspberry Pi

## 📋 ขั้นตอนการเตรียมการ

### 1. ติดตั้ง Dependencies (ทำครั้งเดียว)
```bash
cd ~/io-t-webpage
npm install mqtt @supabase/supabase-js
```

### 2. ตั้งค่า Environment Variables
```bash
# เปิดไฟล์ .env หรือสร้างใหม่
nano .env.local

# เพิ่มบรรทัดเหล่านี้ (แทนด้วยค่าจริงจาก Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...xxx

# บันทึก: Ctrl+O, Enter, Ctrl+X
```

### 3. โหลด Environment Variables
```bash
export $(cat .env.local | xargs)
```

### 4. แก้ไข Device UUID ในสคริปต์
```bash
nano scripts/test_workflow.cjs

# หาบรรทัดนี้และแก้เป็น UUID ของอุปกรณ์คุณ:
# const DEVICE_UUID = '46588dc3-c4d1-4269-b626-90116c8b97a4';

# หา UUID ได้จาก: http://localhost:3000/admin/devices
# หรือจาก Supabase → ตาราง devices → คอลัมน์ id
```

---

## 🚀 วิธีทดสอบ

### ✅ ทดสอบครั้งเดียว (แนะนำเริ่มต้น)
```bash
node scripts/test_workflow.cjs once
```
**ผลลัพธ์ที่คาดหวัง:**
- ✅ เชื่อมต่อ MQTT สำเร็จ
- ✅ ส่งข้อมูลผ่าน MQTT สำเร็จ
- ✅ บันทึกลง Supabase สำเร็จ

---

### 📡 ทดสอบ MQTT เท่านั้น
```bash
node scripts/test_workflow.cjs mqtt
```
ทดสอบการส่งข้อมูลไปยัง MQTT broker (เลียนแบบ ESP32)

---

### 💾 ทดสอบ Supabase เท่านั้น
```bash
node scripts/test_workflow.cjs supabase
```
ทดสอบการบันทึกข้อมูลลงฐานข้อมูล

---

### 🔄 ทดสอบแบบต่อเนื่อง
```bash
# ส่งข้อมูลทุก 5 วินาที จำนวน 10 ครั้ง
node scripts/test_workflow.cjs continuous 5000 10

# ส่งข้อมูลทุก 3 วินาที จำนวน 20 ครั้ง
node scripts/test_workflow.cjs continuous 3000 20

# ส่งข้อมูลทุก 10 วินาที จำนวน 100 ครั้ง (ทดสอบยาว)
node scripts/test_workflow.cjs continuous 10000 100
```

---

## 🔍 ตรวจสอบผลลัพธ์

### 1. ผ่านหน้าเว็บ
```
🌐 เปิดเว็บที่: http://localhost:3000/admin/workflow
```
ดูสถานะแต่ละขั้นตอนและข้อมูลล่าสุด

### 2. ตรวจสอบใน Supabase
```
1. เข้า Supabase Dashboard: https://app.supabase.com
2. เลือก Project ของคุณ
3. Table Editor → sensor_data
4. ดูข้อมูลที่เพิ่มเข้ามา
```

### 3. ตรวจสอบ MQTT ด้วย mosquitto_sub
```bash
# ติดตั้ง mosquitto-clients ถ้ายังไม่มี
sudo apt-get install mosquitto-clients

# รับฟังข้อมูลจาก MQTT
mosquitto_sub -h 192.168.1.142 -p 1883 -t "iot/#" -v

# เปิด Terminal อีกอัน แล้วรันสคริปต์ทดสอบ
node scripts/test_workflow.cjs mqtt
```

---

## 🔧 แก้ไขปัญหาที่พบบ่อย

### ❌ "MQTT Error: connect ECONNREFUSED"
**สาเหตุ:** MQTT broker ไม่ทำงาน หรือ IP ไม่ถูกต้อง

**แก้ไข:**
```bash
# 1. ตรวจสอบ mosquitto ทำงานหรือไม่
sudo systemctl status mosquitto

# 2. เริ่ม mosquitto ถ้ายังไม่ทำงาน
sudo systemctl start mosquitto

# 3. ตรวจสอบ IP address ของ Pi
hostname -I

# 4. แก้ไข IP ในไฟล์ scripts/test_workflow.cjs
nano scripts/test_workflow.cjs
# เปลี่ยน: const MQTT_BROKER = 'mqtt://192.168.1.XXX:1883';
```

---

### ❌ "บันทึกลง Supabase ล้มเหลว"
**สาเหตุ:** UUID ไม่ถูกต้อง หรือ RLS policies ไม่อนุญาต

**แก้ไข:**
```bash
# 1. ตรวจสอบ Device UUID
# เข้า: http://localhost:3000/admin/devices
# คัดลอก ID ของอุปกรณ์ที่ต้องการทดสอบ

# 2. แก้ไข UUID ในสคริปต์
nano scripts/test_workflow.cjs
# เปลี่ยนบรรทัด: const DEVICE_UUID = 'YOUR_DEVICE_UUID';

# 3. ถ้ายังไม่ได้ ตรวจสอบ RLS policies ใน Supabase
# Supabase Dashboard → Authentication → Policies
# ตาราง sensor_data ต้องมี policy ที่อนุญาตให้ insert ได้
```

---

### ❌ "Cannot find module 'mqtt'"
**แก้ไข:**
```bash
cd ~/io-t-webpage
npm install mqtt @supabase/supabase-js
```

---

## 📊 ตัวอย่างผลลัพธ์ที่ถูกต้อง

```
╔════════════════════════════════════════╗
║   🧪 สคริปต์ทดสอบ IoT Workflow        ║
╚════════════════════════════════════════╝

📌 โหมด: ทดสอบครั้งเดียว

📡 กำลังทดสอบ MQTT...
   Broker: mqtt://192.168.1.142:1883
   Topic: iot/Station_1/ammonia
✅ เชื่อมต่อ MQTT Broker สำเร็จ

📤 ส่งข้อมูลทดสอบ:
{
  "device_id": "Station_1",
  "ammonia_ppm": 35.52,
  "temperature": 28.34,
  "humidity": 65.21,
  "timestamp": "2026-01-21T10:30:45.123Z"
}

✅ ส่งข้อมูลผ่าน MQTT สำเร็จ

💾 กำลังทดสอบ Supabase...
   URL: https://xxxxx.supabase.co...
   Device UUID: 46588dc3-c4d1-4269-b626-90116c8b97a4
✅ บันทึกลง Supabase สำเร็จ
   Record ID: 12345678-1234-1234-1234-123456789abc
   Timestamp: 2026-01-21T10:30:45.123Z
   Total records: 42 รายการ

✅ เสร็จสิ้น!
```

---

## 🎯 ลำดับการทดสอบที่แนะนำ

1. **ทดสอบ MQTT ก่อน**
   ```bash
   node scripts/test_workflow.cjs mqtt
   ```

2. **ทดสอบ Supabase**
   ```bash
   node scripts/test_workflow.cjs supabase
   ```

3. **ทดสอบทั้งหมดครั้งเดียว**
   ```bash
   node scripts/test_workflow.cjs once
   ```

4. **ทดสอบแบบต่อเนื่อง** (เลียนแบบ ESP32 จริง)
   ```bash
   node scripts/test_workflow.cjs continuous 5000 10
   ```

5. **เปิดหน้า Workflow ดูผลลัพธ์**
   ```
   http://localhost:3000/admin/workflow
   ```

---

## 📝 หมายเหตุ

- สคริปต์นี้จะสร้างข้อมูลสุ่มในช่วง:
  - Ammonia: 10-60 ppm
  - Temperature: 25-35°C
  - Humidity: 60-80%

- ข้อมูลทดสอบจะถูกบันทึกจริงใน Supabase
- ใช้ Device UUID จริงจากระบบ
- สามารถปรับแต่งค่าใน scripts/test_workflow.cjs ได้

---

## 🔗 เอกสารเพิ่มเติม

- Supabase Dashboard: https://app.supabase.com
- หน้า Workflow: http://localhost:3000/admin/workflow
- หน้า Devices: http://localhost:3000/admin/devices
- หน้า Dashboard: http://localhost:3000/admin/dashboard
