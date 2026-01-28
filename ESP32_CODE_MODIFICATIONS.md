# 🔧 การแก้ไข ESP32 Code - เพิ่มการส่งข้อมูลไป Pi

## 📋 สิ่งที่ต้องเพิ่ม:

### 1. เพิ่ม Constants ด้านบน (หลัง includes)

```cpp
// ===== กำหนดค่าสำหรับ Local Pi MQTT =====
const char* DEVICE_ID = "Station_1";
const char* LOCAL_MQTT_BROKER = "192.168.1.142";
const int LOCAL_MQTT_PORT = 1883;
const char* LOCAL_MQTT_TOPIC_PREFIX = "iot/";
```

---

### 2. เพิ่มฟังก์ชัน getTimestamp() (ก่อน void setup())

```cpp
// ฟังก์ชันสร้าง timestamp จาก millis()
String getTimestamp() {
  unsigned long ms = millis();
  unsigned long seconds = ms / 1000;
  unsigned long minutes = seconds / 60;
  unsigned long hours = minutes / 60;
  char buffer[25];
  snprintf(buffer, sizeof(buffer), "%02lu:%02lu:%02lu", 
           hours % 24, minutes % 60, seconds % 60);
  return String(buffer);
}
```

---

### 3. แก้ไขฟังก์ชัน measureAndSendData()

**หาส่วนนี้ในโค้ด:**
```cpp
void measureAndSendData() {
  // ... อ่านค่าเซนเซอร์ ...
  // ... แสดงผลบนจอ OLED ...
  
  // ส่งข้อมูลผ่าน MQTT
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("MQTT Status:");
  
  if (!client.connected()) {
    reconnectMQTT();
  }
  
  if (client.connected()) {
    // โค้ดเดิมของอาจารย์อยู่ตรงนี้
```

**แทนที่ส่วน `if (client.connected()) { ... }` ด้วย:**

```cpp
  if (client.connected()) {
    // ===================================================================
    // 🔴 COMMENT ไว้ก่อน - ส่วนของอาจารย์ (ทดสอบหลังจาก Pi ทำงานแล้ว)
    // ===================================================================
    /*
    // --- ส่งข้อมูลไปหาอาจารย์ (เดิม) ---
    // MQTT Broker: sci-iot.ddns.net
    // Topic: sensors/ammonia
    // Payload: (ตามโครงสร้างเดิมของอาจารย์)
    
    StaticJsonDocument<256> jsonDoc;
    jsonDoc["ammonia"] = ppm;
    jsonDoc["temperature"] = temperature;
    jsonDoc["humidity"] = humidity;
    jsonDoc["calibratedRo"] = Ro;
    
    char jsonBuffer[256];
    serializeJson(jsonDoc, jsonBuffer);
    
    client.publish("sensors/ammonia", jsonBuffer);
    display.println("Data sent OK (Professor)");
    Serial.print("Published to Professor: sensors/ammonia");
    Serial.println(jsonBuffer);
    */
    
    // ===================================================================
    // ✅ ส่งข้อมูลไป Pi Local (ใหม่ - สำหรับทดสอบ)
    // ===================================================================
    // MQTT Broker: 192.168.1.142
    // Topic: iot/Station_1/ammonia
    // Payload: {"id":"Station_1","ammonia":...,"temperature":...}
    
    String piTopic = String(LOCAL_MQTT_TOPIC_PREFIX) + String(DEVICE_ID) + "/ammonia";
    
    StaticJsonDocument<256> piDoc;
    piDoc["id"] = DEVICE_ID;
    piDoc["ammonia"] = ppm;
    piDoc["temperature"] = temperature;
    piDoc["humidity"] = humidity;
    piDoc["calibratedRo"] = Ro;
    piDoc["timestamp"] = getTimestamp();
    
    char piBuffer[256];
    serializeJson(piDoc, piBuffer);
    
    client.publish(piTopic.c_str(), piBuffer);
    display.println("Data sent OK (Pi Local)");
    Serial.print("Published to Pi: ");
    Serial.println(piTopic);
    Serial.print("Data: ");
    Serial.println(piBuffer);
    
  } else {
    display.println("Failed to send data");
  }
```

---

### 4. แก้ไขฟังก์ชัน reconnectMQTT()

**หาส่วนนี้:**
```cpp
void reconnectMQTT() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting to MQTT");
  display.print("Server: ");
  display.println(mqtt_server);  // <-- บรรทัดนี้
  display.display();
```

**เปลี่ยนเป็น:**
```cpp
void reconnectMQTT() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting to MQTT");
  display.print("Server: ");
  display.println(LOCAL_MQTT_BROKER);  // <-- เปลี่ยนเป็น Pi
  display.display();
```

**และส่วนนี้:**
```cpp
  Serial.print("Connecting to MQTT server ");
  Serial.print(mqtt_server);  // <-- บรรทัดนี้
  Serial.print(":");
  Serial.print(MQTT_PORT);  // <-- อาจต้องเปลี่ยน
```

**เปลี่ยนเป็น:**
```cpp
  Serial.print("Connecting to MQTT server ");
  Serial.print(LOCAL_MQTT_BROKER);  // <-- เชื่อมต่อ Pi
  Serial.print(":");
  Serial.print(LOCAL_MQTT_PORT);
```

**และส่วน client.connect:**
```cpp
  // พยายามเชื่อมต่อ MQTT server
  if (client.connect("MQ137Client")) {
```

---

### 5. แก้ไข setupWiFi() - เปลี่ยนการตั้งค่า MQTT Server

**หาส่วนนี้:**
```cpp
  client.setServer(mqtt_server, MQTT_PORT);
```

**เปลี่ยนเป็น:**
```cpp
  client.setServer(LOCAL_MQTT_BROKER, LOCAL_MQTT_PORT);
```

**และหาส่วนที่แสดงผลบนจอ:**
```cpp
  display.print("MQTT: ");
  display.println(mqtt_server);  // <-- บรรทัดนี้
```

**เปลี่ยนเป็น:**
```cpp
  display.print("MQTT: ");
  display.println(LOCAL_MQTT_BROKER);
```

---

## 🎯 สรุปการแก้ไข:

### ที่เพิ่ม:
- ✅ Constants สำหรับ Pi (DEVICE_ID, LOCAL_MQTT_BROKER, LOCAL_MQTT_PORT, LOCAL_MQTT_TOPIC_PREFIX)
- ✅ ฟังก์ชัน getTimestamp()
- ✅ โค้ดส่งข้อมูลไป Pi พร้อม JSON format ใหม่

### ที่ Comment:
- 🔴 โค้ดส่งข้อมูลหาอาจารย์ (sci-iot.ddns.net) - ไว้เปิดทีหลัง

### ที่เปลี่ยน:
- 🔧 `mqtt_server` → `LOCAL_MQTT_BROKER` ทั้งหมด
- 🔧 `MQTT_PORT` → `LOCAL_MQTT_PORT`

---

## 📝 หมายเหตุ:

**หลังจากทดสอบกับ Pi สำเร็จแล้ว:**
1. Uncomment โค้ดของอาจารย์
2. เพิ่ม MQTT client ตัวที่ 2 สำหรับอาจารย์
3. ส่งข้อมูลไปทั้ง 2 ที่พร้อมกัน

**ตอนนี้:**
- ESP32 เชื่อมต่อ: 192.168.1.142:1883
- ส่งข้อมูลไปที่: iot/Station_1/ammonia
- Pi รับและบันทึกลง CSV + Supabase

---

## 🚀 ทดสอบ:

1. Upload โค้ดไป ESP32
2. เปิด Serial Monitor (115200 baud)
3. ดูว่าเชื่อมต่อ WiFi และ MQTT สำเร็จ
4. ตรวจสอบ:
   - Serial Monitor: "Published to Pi: iot/Station_1/ammonia"
   - Pi terminal: `journalctl -u iot-data-logger -f`
   - Supabase: ต้องเห็นข้อมูลใหม่

Good luck! 🎉
