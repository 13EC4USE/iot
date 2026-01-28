# ESP32 Production Code - IoT Ammonia Monitoring

## 📋 ข้อมูลที่ต้องเตรียม

จากหน้า **Admin Dashboard** (`/admin/devices`):
1. **Device ID** (mqtt_client_id) - เช่น `Station_1`
2. **Device UUID** - เช่น `46588dc3-c4d1-4269-b626-90116c8b97a4`
3. **MQTT Broker IP** - เช่น `192.168.1.142`

---

## 🔧 Arduino Code (ESP32)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========================================
// 📝 กำหนดค่า - แก้ไขตรงนี้
// ========================================

// WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker (Raspberry Pi)
const char* mqtt_server = "192.168.1.142";  // IP ของ Raspberry Pi
const int mqtt_port = 1883;
const char* mqtt_user = "iot_user";         // ถ้ามี authentication
const char* mqtt_password = "iot_password"; // ถ้ามี authentication

// Device Info
const char* device_id = "Station_1";        // ดูจากหน้า /admin/devices
const char* mqtt_topic = "iot/Station_1/ammonia";

// Sensor Pins
#define AMMONIA_SENSOR_PIN 34  // ADC pin สำหรับเซนเซอร์แอมโมเนีย
#define DHT_PIN 4              // DHT22 pin (optional)

// ========================================
// 📡 MQTT Setup
// ========================================
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastPublish = 0;
const long publishInterval = 60000; // ส่งทุก 60 วินาที

void setup() {
  Serial.begin(115200);
  
  // เชื่อมต่อ WiFi
  setup_wifi();
  
  // ตั้งค่า MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  Serial.println("✅ ESP32 Ready!");
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("📡 Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("✅ WiFi connected");
  Serial.print("   IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Attempting MQTT connection...");
    
    // พยายามเชื่อมต่อ
    if (client.connect(device_id, mqtt_user, mqtt_password)) {
      Serial.println(" connected!");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

float readAmmoniaPPM() {
  // อ่านค่าจาก ADC
  int sensorValue = analogRead(AMMONIA_SENSOR_PIN);
  
  // แปลงเป็น voltage (ESP32: 0-3.3V, 12-bit ADC: 0-4095)
  float voltage = sensorValue * (3.3 / 4095.0);
  
  // แปลงเป็น PPM (ปรับสูตรตามเซนเซอร์ของคุณ)
  // ตัวอย่างนี้เป็นสูตรทั่วไป แต่จริงๆ ต้องดู datasheet ของเซนเซอร์
  float ppm = voltage * 10.0; // ปรับค่าตามการ calibrate
  
  return ppm;
}

float readTemperature() {
  // ถ้าใช้ DHT22 ให้ใช้ library DHT
  // return dht.readTemperature();
  
  // ตัวอย่างค่าสมมุติ
  return 28.5;
}

float readHumidity() {
  // ถ้าใช้ DHT22 ให้ใช้ library DHT
  // return dht.readHumidity();
  
  // ตัวอย่างค่าสมมุติ
  return 65.0;
}

void publishData() {
  // อ่านค่าจากเซนเซอร์
  float ammonia = readAmmoniaPPM();
  float temperature = readTemperature();
  float humidity = readHumidity();
  
  // สร้าง JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"] = device_id;
  doc["ammonia_ppm"] = ammonia;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["timestamp"] = millis(); // หรือใช้ NTP time
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // ส่งข้อมูล
  if (client.publish(mqtt_topic, buffer)) {
    Serial.println("📤 Data published:");
    Serial.println(buffer);
  } else {
    Serial.println("❌ Publish failed");
  }
}

void loop() {
  // ตรวจสอบการเชื่อมต่อ MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // ส่งข้อมูลตาม interval
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishData();
  }
}
```

---

## 📦 Libraries ที่ต้องติดตั้ง

ใน Arduino IDE:
1. **PubSubClient** by Nick O'Leary
2. **ArduinoJson** by Benoit Blanchon
3. **DHT sensor library** (ถ้าใช้ DHT22)

---

## 🔌 Pin Connection

### MQ137 Ammonia Sensor (ตัวอย่าง)
- VCC → 3.3V (ESP32)
- GND → GND
- A0 → GPIO34 (ADC1_CH6)

### DHT22 Temperature & Humidity
- VCC → 3.3V
- DATA → GPIO4
- GND → GND

---

## ⚙️ Configuration Steps

### 1. แก้ไขค่าในโค้ด

```cpp
const char* ssid = "YourWiFiName";
const char* password = "YourWiFiPassword";
const char* mqtt_server = "192.168.1.142"; // IP ของ Raspberry Pi
const char* device_id = "Station_1";       // ดูจาก /admin/devices
```

### 2. Calibrate Sensor

ดู datasheet ของเซนเซอร์ เช่น:
- **MQ137**: Rs/R0 ratio vs PPM curve
- แปลง voltage → resistance → PPM

### 3. Upload Code

1. เลือก Board: **ESP32 Dev Module**
2. เลือก Port: COM port ของ ESP32
3. กด Upload

### 4. Monitor Serial Output

```
📡 Connecting to YourWiFi....
✅ WiFi connected
   IP address: 192.168.1.100
🔄 Attempting MQTT connection... connected!
✅ ESP32 Ready!
📤 Data published:
{"device_id":"Station_1","ammonia_ppm":25.3,"temperature":28.5,"humidity":65.0}
```

---

## 🧪 Testing

### Test บน Raspberry Pi

```bash
# ติดตั้ง mosquitto-clients
sudo apt install mosquitto-clients -y

# Subscribe ดูข้อมูล
mosquitto_sub -h localhost -t "iot/Station_1/ammonia" -v

# ควรเห็น:
# iot/Station_1/ammonia {"device_id":"Station_1","ammonia_ppm":25.3,...}
```

### ตรวจสอบใน Dashboard

1. เปิด `/admin/workflow` → ดู Messages Today
2. เปิด `/admin/monitoring` → ดู Real-time data
3. เปิด `/admin/devices` → ดู Last Update timestamp

---

## 🔧 Troubleshooting

### ❌ ข้อมูลไม่เข้า Supabase

ตรวจสอบ `mqtt_listener.cjs` บน Raspberry Pi:
```bash
# ตรวจสอบ log
pm2 logs mqtt_listener

# Restart service
pm2 restart mqtt_listener
```

### ❌ ESP32 เชื่อมต่อ MQTT ไม่ได้

1. ตรวจสอบ IP ของ Raspberry Pi: `hostname -I`
2. ตรวจสอบ firewall: `sudo ufw status`
3. Ping ทดสอบ: `ping 192.168.1.142`

### ❌ ค่า Sensor ผิดปกติ

1. ตรวจสอบ voltage: `Serial.println(voltage);`
2. Calibrate ใหม่ตามบรรยากาศ (clean air)
3. ตรวจสอบ wiring

---

## 📈 Production Checklist

- [ ] แก้ WiFi credentials
- [ ] แก้ MQTT broker IP
- [ ] Calibrate sensor
- [ ] ทดสอบส่งข้อมูล 10 ครั้ง
- [ ] ตรวจสอบข้อมูลใน Dashboard
- [ ] ตั้งค่า alert thresholds
- [ ] ติดตั้ง ESP32 ในตำแหน่งจริง
- [ ] Monitor ต่อเนื่อง 24 ชั่วโมง

---

## 🚀 Advanced Features

### 1. NTP Time Sync

```cpp
#include <time.h>

void setup() {
  // ...
  configTime(7 * 3600, 0, "pool.ntp.org"); // GMT+7
}

String getISO8601Time() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    return "";
  }
  char buffer[25];
  strftime(buffer, 25, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}
```

### 2. Battery Monitoring

```cpp
float readBatteryLevel() {
  int raw = analogRead(BATTERY_PIN);
  float voltage = raw * (3.3 / 4095.0) * 2; // voltage divider
  float percentage = ((voltage - 3.0) / (4.2 - 3.0)) * 100;
  return constrain(percentage, 0, 100);
}
```

### 3. Deep Sleep (ประหยัดพลังงาน)

```cpp
void goToSleep() {
  Serial.println("💤 Going to sleep...");
  esp_sleep_enable_timer_wakeup(60 * 1000000); // 60 วินาที
  esp_deep_sleep_start();
}
```

---

**อัพเดทล่าสุด**: 2026-01-21
**Support**: ดูเพิ่มเติมที่ `/docs/MQTT_CONTROL_GUIDE.md`
