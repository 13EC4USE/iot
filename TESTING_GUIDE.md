# ขั้นตอนการทดสอบระบบ IoT บน Raspberry Pi
# Testing Guide for IoT System

## 📋 เตรียมความพร้อม

### 1. ตรวจสอบว่า Mosquitto กำลังรันอยู่
```bash
sudo systemctl status mosquitto
```

หากไม่ได้รัน:
```bash
sudo systemctl start mosquitto
```

### 2. ตรวจสอบว่า config_manager_pi.py รันอยู่
```bash
ps aux | grep config_manager_pi.py
```

หากไม่ได้รัน:
```bash
cd /home/pi/io-t-webpage
python3 config_manager_pi.py &
```

### 3. ตรวจสอบว่า data_logger_updated.py รันอยู่
```bash
ps aux | grep data_logger_updated.py
```

หากไม่ได้รัน:
```bash
cd /home/pi/io-t-webpage
python3 data_logger_updated.py &
```

---

## 🧪 ทดสอบระบบทีละขั้นตอน

### ขั้นตอนที่ 1: ทดสอบ MQTT Broker
```bash
# Terminal 1: Subscribe เพื่อรับข้อมูล
mosquitto_sub -h 192.168.1.142 -p 1883 -t "iot/#" -v

# Terminal 2: Publish ข้อมูลทดสอบ
mosquitto_pub -h 192.168.1.142 -p 1883 \
  -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":25.5,"temperature":27.0,"humidity":60.0,"calibratedRo":10.0,"timestamp":"12:00:00"}'
```

**ผลลัพธ์ที่ต้องการ:** Terminal 1 ต้องเห็นข้อความที่ส่งไป

---

### ขั้นตอนที่ 2: ทดสอบ CSV Logging
```bash
# ส่งข้อมูลทดสอบ
mosquitto_pub -h 192.168.1.142 -p 1883 \
  -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":18.7,"temperature":26.5,"humidity":58.3,"calibratedRo":9.5,"timestamp":"12:05:30"}'

# รอ 2 วินาที
sleep 2

# ตรวจสอบไฟล์ CSV
tail -n 5 sensor_data.csv
```

**ผลลัพธ์ที่ต้องการ:** ต้องเห็นข้อมูลใหม่ในไฟล์ CSV

---

### ขั้นตอนที่ 3: ทดสอบ Supabase Upload
```bash
# ส่งข้อมูลทดสอบ
mosquitto_pub -h 192.168.1.142 -p 1883 \
  -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":32.1,"temperature":29.0,"humidity":72.5,"calibratedRo":10.2,"timestamp":"12:10:15"}'

# ตรวจสอบ output ของ data_logger
# ควรเห็นข้อความ "☁️ Uploaded to Supabase: Station_1 -> 32.1 ppm"
```

**ผลลัพธ์ที่ต้องการ:** 
1. เห็นข้อความใน Terminal ว่า upload สำเร็จ
2. เปิด Supabase Dashboard → Table Editor → sensor_data → เห็นแถวใหม่

---

### ขั้นตอนที่ 4: ทดสอบ Config API
```bash
# ทดสอบดึง config
curl http://192.168.1.142:5000/api/config

# ทดสอบอัปเดต device
curl -X POST http://192.168.1.142:5000/api/config/device/Station_1 \
  -H "Content-Type: application/json" \
  -d '{"device_id":"Station_1","uuid":"46588dc3-c4d1-4269-b626-90116c8b97a4","enabled":true}'

# ตรวจสอบว่า config ถูกบันทึก
cat iot_config.json
```

**ผลลัพธ์ที่ต้องการ:** 
1. API ตอบกลับข้อมูล JSON
2. ไฟล์ `iot_config.json` ถูกอัปเดต

---

## 🔧 Troubleshooting

### ถ้า Mosquitto ไม่ทำงาน
```bash
# ตรวจสอบ log
sudo journalctl -u mosquitto -n 50

# รีสตาร์ท
sudo systemctl restart mosquitto
```

### ถ้า Data Logger ไม่ทำงาน
```bash
# ดู error
python3 data_logger_updated.py

# ตรวจสอบว่ามี dependencies ครบ
pip3 install paho-mqtt supabase
```

### ถ้า Config Manager ไม่ทำงาน
```bash
# ดู error
python3 config_manager_pi.py

# ตรวจสอบ dependencies
pip3 install flask
```

### ถ้า Supabase upload ไม่สำเร็จ
1. ตรวจสอบว่า SUPABASE_URL และ SUPABASE_KEY ถูกต้อง
2. ตรวจสอบว่า RLS policies เปิดใช้งาน (anon role ต้องมีสิทธิ์ INSERT)
3. ตรวจสอบว่า device_id มี UUID mapping ใน `iot_config.json`

---

## ✅ Checklist สำหรับการติดตั้งครั้งแรก

- [ ] Mosquitto ติดตั้งและรันอยู่ (port 1883)
- [ ] Python 3 ติดตั้งแล้ว
- [ ] Dependencies ติดตั้งแล้ว: `pip3 install paho-mqtt supabase flask`
- [ ] ไฟล์ `iot_config.json` มีอยู่ใน working directory
- [ ] `config_manager_pi.py` รันอยู่ (port 5000)
- [ ] `data_logger_updated.py` รันอยู่
- [ ] ทดสอบ MQTT pub/sub ผ่าน ✅
- [ ] ทดสอบ CSV logging ผ่าน ✅
- [ ] ทดสอบ Supabase upload ผ่าน ✅
- [ ] ทดสอบ Config API ผ่าน ✅

---

## 🚀 Ready for ESP32!

เมื่อทดสอบทุกขั้นตอนผ่านแล้ว:
1. อัปโหลดโค้ดไปที่ ESP32
2. เปิด Serial Monitor ดูว่า ESP32 เชื่อมต่อ WiFi และ MQTT สำเร็จ
3. ตรวจสอบว่าข้อมูลจาก ESP32 ปรากฏใน:
   - Terminal ของ `data_logger_updated.py`
   - ไฟล์ `sensor_data.csv`
   - Supabase table `sensor_data`

Good luck! 🎉
