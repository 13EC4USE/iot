# การเชื่อมต่ออุปกรณ์ IoT

## ขั้นตอนการเตรียมอุปกรณ์

### 1. สร้างอุปกรณ์ใหม่ใน Dashboard
1. ไปที่ `/admin/devices`
2. คลิก "เพิ่มอุปกรณ์"
3. กรอกข้อมูล: ชื่อ, ประเภท, ตำแหน่ง
4. บันทึกแล้วจด `device_id` ไว้

### 2. ดึง MQTT Credentials
ใช้ API หรือดูจาก Database:
```javascript
// ใน browser console ที่หน้า control
const deviceId = "your-device-id"
const response = await fetch(`/api/devices/${deviceId}/settings`)
const data = await response.json()
console.log("MQTT Credentials:", data.settings)
```

### 3. ตัวอย่างโค้ด ESP32 (Arduino)

#### ติดตั้ง Libraries
```cpp
// ใน Arduino IDE: Tools > Manage Libraries
// ติดตั้ง:
// - PubSubClient by Nick O'Leary
// - ArduinoJson by Benoit Blanchon
// - WiFi (built-in)
```

#### โค้ดตัวอย่าง
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker
const char* mqtt_server = "your-mqtt-broker.com"; // หรือ localhost
const int mqtt_port = 1883;
const char* mqtt_user = "your-mqtt-username";     // ถ้ามี
const char* mqtt_pass = "your-mqtt-password";     // ถ้ามี

// Device Info (ได้จาก Dashboard)
const char* device_id = "your-device-id-from-database";
const char* mqtt_client_id = "device_001";

// MQTT Topics
String topic_telemetry = String("iot/") + device_id + "/telemetry";
String topic_control = String("iot/") + device_id + "/control";

WiFiClient espClient;
PubSubClient client(espClient);

// ========================================
// Setup WiFi
// ========================================
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// ========================================
// MQTT Callback (รับคำสั่งจาก Server)
// ========================================
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  // ดึง command
  const char* cmd = doc["command"];
  Serial.print("Command: ");
  Serial.println(cmd);

  // ประมวลผลคำสั่ง
  if (strcmp(cmd, "on") == 0) {
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("LED ON");
  } 
  else if (strcmp(cmd, "off") == 0) {
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("LED OFF");
  }
  else if (strcmp(cmd, "status") == 0) {
    sendTelemetry();
  }
}

// ========================================
// Reconnect MQTT
// ========================================
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(mqtt_client_id, mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      
      // Subscribe to control topic
      client.subscribe(topic_control.c_str());
      Serial.print("Subscribed to: ");
      Serial.println(topic_control);
      
      // ส่งข้อมูลเริ่มต้น
      sendTelemetry();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

// ========================================
// ส่งข้อมูล Telemetry
// ========================================
void sendTelemetry() {
  StaticJsonDocument<200> doc;
  
  // ข้อมูลตัวอย่าง
  doc["temperature"] = random(20, 35);        // อุณหภูมิ 20-35°C
  doc["humidity"] = random(40, 80);           // ความชื้น 40-80%
  doc["battery_level"] = random(70, 100);     // แบตเตอรี่ 70-100%
  doc["value"] = random(0, 100);              // ค่าอื่นๆ
  doc["unit"] = "units";
  doc["timestamp"] = millis();                // เวลา (milliseconds)

  String output;
  serializeJson(doc, output);
  
  Serial.print("Publishing to ");
  Serial.print(topic_telemetry);
  Serial.print(": ");
  Serial.println(output);
  
  client.publish(topic_telemetry.c_str(), output.c_str());
}

// ========================================
// Setup
// ========================================
void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  
  setup_wifi();
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ========================================
// Loop
// ========================================
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // ส่งข้อมูลทุก 30 วินาที
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 30000) {
    lastMsg = now;
    sendTelemetry();
  }
}
```

---

## 4. ตัวอย่างโค้ด Python (Raspberry Pi)

```python
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "your-mqtt-broker.com"
MQTT_PORT = 1883
MQTT_USER = "your-username"
MQTT_PASS = "your-password"

# Device Info
DEVICE_ID = "your-device-id-from-database"
CLIENT_ID = "rpi_device_001"

# Topics
TOPIC_TELEMETRY = f"iot/{DEVICE_ID}/telemetry"
TOPIC_CONTROL = f"iot/{DEVICE_ID}/control"

# ========================================
# MQTT Callbacks
# ========================================
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe(TOPIC_CONTROL)
    print(f"Subscribed to {TOPIC_CONTROL}")

def on_message(client, userdata, msg):
    print(f"Message received: {msg.topic} -> {msg.payload.decode()}")
    
    try:
        data = json.loads(msg.payload.decode())
        command = data.get("command")
        
        if command == "on":
            print("Turning device ON")
            # เพิ่มโค้ดเปิดอุปกรณ์
            
        elif command == "off":
            print("Turning device OFF")
            # เพิ่มโค้ดปิดอุปกรณ์
            
        elif command == "status":
            send_telemetry(client)
            
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")

# ========================================
# Send Telemetry Data
# ========================================
def send_telemetry(client):
    data = {
        "temperature": round(random.uniform(20, 35), 2),
        "humidity": round(random.uniform(40, 80), 2),
        "battery_level": random.randint(70, 100),
        "value": random.randint(0, 100),
        "unit": "units",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    payload = json.dumps(data)
    client.publish(TOPIC_TELEMETRY, payload)
    print(f"Published to {TOPIC_TELEMETRY}: {payload}")

# ========================================
# Main
# ========================================
def main():
    client = mqtt.Client(CLIENT_ID)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = on_connect
    client.on_message = on_message
    
    print(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    # Start loop
    client.loop_start()
    
    try:
        while True:
            send_telemetry(client)
            time.sleep(30)  # ส่งข้อมูลทุก 30 วินาที
            
    except KeyboardInterrupt:
        print("\nDisconnecting...")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
```

---

## 5. ทดสอบด้วย MQTT Client (ก่อนเขียนโค้ดจริง)

### ใช้ MQTT Explorer (GUI)
1. ดาวน์โหลด: http://mqtt-explorer.com/
2. เชื่อมต่อไปยัง Broker
3. Subscribe: `iot/+/telemetry`
4. Publish ไปที่: `iot/{device-id}/control`
```json
{"command": "on"}
```

### ใช้ mosquitto_pub/sub (Command Line)
```bash
# Subscribe (รับข้อมูล)
mosquitto_sub -h localhost -t "iot/+/telemetry" -v

# Publish (ส่งข้อมูล)
mosquitto_pub -h localhost -t "iot/device-123/telemetry" -m '{"temperature":25,"humidity":60}'

# ส่งคำสั่ง
mosquitto_pub -h localhost -t "iot/device-123/control" -m '{"command":"on"}'
```

---

## 6. MQTT Topics Structure

```
iot/{device_id}/telemetry    → อุปกรณ์ส่งข้อมูลมา
iot/{device_id}/control      → Server ส่งคำสั่งไป
iot/{device_id}/status       → สถานะอุปกรณ์
```

---

## 7. JSON Format

### Telemetry (อุปกรณ์ → Server)
```json
{
  "temperature": 25.5,
  "humidity": 60,
  "battery_level": 85,
  "value": 42,
  "unit": "units",
  "timestamp": "2025-12-06T10:30:00Z"
}
```

### Control (Server → อุปกรณ์)
```json
{
  "command": "on"
}
```
Commands: `on`, `off`, `status`, `restart`, `config`

---

## Checklist ก่อนใช้งานจริง

- [ ] MQTT Broker รันอยู่และเข้าถึงได้
- [ ] Environment variables ตั้งค่าครบ
- [ ] รัน SQL script สร้าง mqtt_credentials columns
- [ ] สร้างอุปกรณ์ใน Dashboard และจด device_id
- [ ] อุปกรณ์เชื่อมต่อ WiFi ได้
- [ ] ทดสอบ publish/subscribe ด้วย MQTT client
- [ ] ตรวจสอบข้อมูลแสดงใน Dashboard

---

## Troubleshooting

### อุปกรณ์เชื่อมต่อ MQTT ไม่ได้
- ตรวจสอบ Broker URL, Port, Username, Password
- ตรวจสอบ Firewall
- ใช้ `telnet broker-url 1883` เช็ค connection

### ข้อมูลไม่แสดงใน Dashboard
- เช็ค MQTT Ingest API ว่ารันอยู่ไหม (`/api/mqtt/ingest`)
- เช็ค Console ใน browser หา error
- เช็ค Database ว่าข้อมูลเข้า `sensor_data` table ไหม

### อุปกรณ์รับคำสั่งไม่ได้
- เช็คว่า subscribe topic ถูกไหม
- เช็ค callback function ทำงานไหม
- ลองส่งคำสั่งด้วย MQTT Explorer ก่อน
