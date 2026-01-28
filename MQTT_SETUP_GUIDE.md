# คู่มือตั้งค่า MQTT ให้ทำงานร่วมกัน
# ฉบับที่ 1: ใช้ Raspberry Pi เป็นศูนย์กลาง

## 🎯 สถาปัตยกรรม
```
ESP32 → Raspberry Pi (Mosquitto:1883) → เว็บ/Supabase
         [Topic: iot/Station_1/ammonia]
```

---

## 📝 ขั้นตอนการตั้งค่า

### 1️⃣ หา IP ของ Raspberry Pi

บน Raspberry Pi ให้รันคำสั่ง:
```bash
hostname -I
```
สมมติได้ IP: `192.168.1.100`

---

### 2️⃣ ตั้งค่า Mosquitto บน Raspberry Pi

แก้ไฟล์ `/etc/mosquitto/mosquitto.conf`:
```conf
# อนุญาตให้เชื่อมต่อจากเครือข่ายภายนอก
listener 1883 0.0.0.0
allow_anonymous true

# หรือถ้าต้องการ username/password
# password_file /etc/mosquitto/passwd
```

รีสตาร์ท Mosquitto:
```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

ทดสอบว่าทำงาน:
```bash
mosquitto_sub -h localhost -t "iot/#" -v
```

---

### 3️⃣ แก้โค้ด ESP32

**ที่ต้องเปลี่ยน:**

1. **Broker IP** - ตั้งค่าผ่าน WiFiManager หรือแก้ default:
```cpp
char mqtt_server[40] = "192.168.1.100"; // IP ของ Raspberry Pi
```

2. **Topic Format** - เปลี่ยนจาก `sensors/ammonia` เป็น:
```cpp
void measureAndSendData() {
  // ... (โค้ดเดิม)
  
  // สร้าง topic ใหม่
  char topic[64];
  snprintf(topic, sizeof(topic), "iot/%s/ammonia", DEVICE_ID);
  
  // Publish
  if (!client.connected()) reconnectMQTT();
  if (client.connected()) {
    client.publish(topic, jsonBuffer);  // ใช้ topic ใหม่
    Serial.print("Published to: ");
    Serial.println(topic);
    Serial.println(jsonBuffer);
  }
}
```

**ไฟล์เต็ม:** ดูใน `ESP32_UPDATED_CODE.txt` ที่สร้างไว้

---

### 4️⃣ แก้ Python script บน Raspberry Pi

แก้ `data_logger.py`:

```python
# เปลี่ยน topic
LOCAL_TOPIC = "iot/#"  # ฟังทุก device ใน iot/

# ฟังก์ชัน on_message รองรับ topic ใหม่
def on_message(client, userdata, msg):
    try:
        topic_str = msg.topic  # เช่น iot/Station_1/ammonia
        payload_str = msg.payload.decode()
        payload = json.loads(payload_str)
        
        print(f"📥 Received from {topic_str}")
        
        # ทำงาน 2 อย่าง
        save_to_csv(payload)
        save_to_supabase(payload)
        
    except Exception as e:
        print(f"Error: {e}")

# เริ่มระบบ
client = mqtt.Client()
client.connect("localhost", 1883, 60)
client.subscribe(LOCAL_TOPIC)  # subscribe iot/#
client.on_message = on_message
client.loop_start()
```

รันสคริปต์:
```bash
python3 data_logger.py
```

---

### 5️⃣ แก้ไฟล์ `.env.local` บนเว็บ

แก้บรรทัดนี้ (ทำไว้แล้ว ✅):
```env
NEXT_PUBLIC_MQTT_BROKER=mqtt://192.168.1.100:1883
NEXT_PUBLIC_MQTT_TOPIC_PREFIX=iot/
```

รีสตาร์ทเซิร์ฟเวอร์:
```bash
npm run dev
```

---

## ✅ ทดสอบการทำงาน

### ทดสอบ 1: ส่งข้อความจำลอง
บน Raspberry Pi:
```bash
mosquitto_pub -h localhost -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":15.2,"temperature":28.5,"humidity":65.0}'
```

### ทดสอบ 2: ฟังข้อความ
Terminal 1 (Pi):
```bash
mosquitto_sub -h localhost -t "iot/#" -v
```

Terminal 2 (คอมพิวเตอร์):
```bash
mosquitto_sub -h 192.168.1.100 -t "iot/#" -v
```

### ทดสอบ 3: ดูบนเว็บ
- เปิด http://localhost:3000/admin/telemetry
- ตั้ง Topic: `iot/#`
- กด "เริ่มฟัง"
- ส่งข้อความจำลอง (ทดสอบ 1) ควรเห็นทันที

---

## 🔧 Troubleshooting

**ปัญหา: เว็บไม่เห็นข้อความ**
1. เช็ค IP ใน `.env.local` ตรงกับ Pi ไหม
2. Restart `npm run dev`
3. เปิด Console (F12) ดู error MQTT connection

**ปัญหา: Pi ไม่ได้รับข้อความจาก ESP**
1. เช็ค ESP ตั้ง broker IP ถูกต้องไหม (ผ่าน WiFiManager)
2. ดู Serial Monitor ของ ESP ว่า connect สำเร็จไหม
3. ลอง ping Pi จาก ESP: `ping 192.168.1.100`

**ปัญหา: Firewall บล็อก port 1883**
บน Pi:
```bash
sudo ufw allow 1883/tcp
sudo ufw reload
```

---

## 🚀 ข้อดีของวิธีนี้

✅ ง่าย - ไม่ต้อง TLS/SSL
✅ เร็ว - ภายในเครือข่ายเดียว
✅ ยืดหยุ่น - เปลี่ยน topic/broker ได้ง่าย
✅ ปลอดภัย - ข้อมูลไม่ออกนอกบ้าน (Pi backup + cloud สำรอง)
✅ ขยายได้ - เพิ่ม ESP หลายตัว ง่าย (แค่เปลี่ยน DEVICE_ID)

---

## 📌 หมายเหตุ

- ถ้าใช้ WiFi บ้าน IP อาจเปลี่ยน → ควรตั้ง Static IP ให้ Pi
- ถ้าต้องการเข้าจากนอกบ้าน → ใช้ VPN หรือ Port Forward (ระวังความปลอดภัย)
- ถ้าอนาคตต้องการ cloud จริงๆ → เปลี่ยนเป็น HiveMQ (มีคู่มือแยก)
