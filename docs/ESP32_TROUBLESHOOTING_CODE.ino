/* 
 * ESP32 IoT Ammonia Monitor - TROUBLESHOOTING GUIDE
 * เวอร์ชันปรับปรุงมี error handling
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// ========================================
// 📝 Configuration - Edit These
// ========================================

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "192.168.1.142";
const char* device_id = "Station_1";

// Pin Configuration
#define AMMONIA_SENSOR_PIN 34     // ADC pin - ✅ CRITICAL: Must be ADC pin!
#define DHT_PIN 4                 // DHT22 pin
#define LED_BUILTIN 2             // Status LED

// ========================================
// 🔧 Sensor Configuration
// ========================================
#define RL_RESISTANCE 10.0        // Load resistor (kOhms)
#define MQ137_RO_DEFAULT 10.0     // Initial R0 estimate

// DHT22 without library (manual reading)
const int DHT_TIMEOUT = 10000;    // timeout in us

// ========================================
// MQTT & WiFi
// ========================================
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublish = 0;
const long publishInterval = 60000;  // 1 minute

// ========================================
// 🔍 DIAGNOSTIC MODE
// ========================================
#define DIAGNOSTIC_MODE true  // Set to true for verbose logging

void debug_println(String msg) {
  if (DIAGNOSTIC_MODE) {
    Serial.println("[DEBUG] " + msg);
  }
}

void debug_print(String msg) {
  if (DIAGNOSTIC_MODE) {
    Serial.print("[DEBUG] " + msg);
  }
}

// ========================================
// Setup & Loop
// ========================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== ESP32 IoT Ammonia Monitor ===");
  Serial.println("Booting...");
  
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(AMMONIA_SENSOR_PIN, INPUT);
  
  // Check ADC pin
  debug_println("ADC Pin Check: " + String(AMMONIA_SENSOR_PIN));
  int adc_test = analogRead(AMMONIA_SENSOR_PIN);
  debug_println("ADC Test Read: " + String(adc_test));
  
  if (adc_test == 0) {
    Serial.println("⚠️  WARNING: ADC reading is 0!");
    Serial.println("   Check your sensor wiring:");
    Serial.println("   - Sensor A0 → ESP32 GPIO34 (ADC1_CH6)");
    Serial.println("   - Sensor GND → ESP32 GND");
    Serial.println("   - Sensor VCC → ESP32 3.3V");
  }
  
  // Initialize EEPROM
  EEPROM.begin(64);
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  
  // Calibrate sensor in clean air
  calibrate_MQ137();
  
  Serial.println("✅ Setup complete!");
}

void setup_wifi() {
  Serial.print("\n📡 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection FAILED");
    Serial.println("   Check SSID & password");
  }
}

// ========================================
// 📊 Sensor Reading
// ========================================

float readADC_Averaged(int samples = 10) {
  float sum = 0;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(AMMONIA_SENSOR_PIN);
    sum += raw;
    debug_print(".");
    delay(10);
  }
  
  float average = sum / samples;
  debug_println(" avg=" + String(average));
  return average;
}

float calculateAmmonia(float adcValue, float ro, float temp, float humidity) {
  if (adcValue <= 0) {
    Serial.println("❌ ADC value is 0 or negative!");
    return 0;
  }
  
  // Convert ADC to voltage (ESP32: 0-4095 = 0-3.3V)
  float voltage = adcValue * (3.3 / 4095.0);
  
  // Calculate RS (sensor resistance)
  float vrl = voltage;  // Voltage across load resistor
  float vrs = 3.3 - vrl;  // Voltage across sensor
  
  if (vrs <= 0) {
    Serial.println("❌ VRS is 0 or negative! Sensor may not be connected.");
    return 0;
  }
  
  float rs = (vrl / vrs) * RL_RESISTANCE;
  
  // Temperature compensation (Humidity compensation optional)
  float temp_factor = 0.00035 * (temp - 20);
  float rs_compensated = rs / (1.0 + temp_factor);
  
  if (rs_compensated <= 0 || ro <= 0) {
    Serial.println("❌ RS or RO is invalid");
    return 0;
  }
  
  float ratio = rs_compensated / ro;
  
  // MQ137 equation: PPM = 10 * (RS/RO)^(-0.7)
  float ammonia = 10.0 * pow(ratio, -0.7);
  
  // Debug output
  debug_println("ADC:" + String(adcValue) + " V:" + String(voltage, 3) + 
                " RS:" + String(rs, 2) + " PPM:" + String(ammonia, 2));
  
  return constrain(ammonia, 0, 500);  // Limit to 0-500 ppm
}

// ========================================
// 🔧 Calibration
// ========================================

void calibrate_MQ137() {
  Serial.println("\n🔧 Calibrating MQ-137 in clean air (60 sec)...");
  
  float sum_rs = 0;
  int samples = 20;
  
  for (int i = 0; i < samples; i++) {
    float adc = readADC_Averaged(5);
    float voltage = adc * (3.3 / 4095.0);
    float vrl = voltage;
    float vrs = 3.3 - vrl;
    
    if (vrs > 0) {
      float rs = (vrl / vrs) * RL_RESISTANCE;
      sum_rs += rs;
      Serial.print("R");
    } else {
      Serial.print("E");  // Error
    }
    
    delay(3000);
  }
  
  float ro = sum_rs / samples;
  
  if (ro > 0 && ro < 1000) {
    Serial.println("\n✅ Calibration complete!");
    Serial.println("   RO = " + String(ro, 2) + " kOhms");
    
    // Save to EEPROM
    EEPROM.put(0, ro);
    EEPROM.commit();
  } else {
    Serial.println("\n❌ Calibration FAILED - RO out of range: " + String(ro));
    Serial.println("   Check sensor connection!");
  }
}

// ========================================
// 📡 MQTT
// ========================================

void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 MQTT connecting...");
    
    if (client.connect(device_id)) {
      Serial.println(" ✅ connected");
    } else {
      Serial.print(" ❌ failed (code=" + String(client.state()));
      Serial.println(") retry in 5s");
      delay(5000);
    }
  }
}

String getISO8601Time() {
  // Simple timestamp (TODO: add NTP sync)
  unsigned long ms = millis();
  int seconds = (ms / 1000) % 60;
  int minutes = (ms / 60000) % 60;
  int hours = (ms / 3600000) % 24;
  
  char buffer[30];
  sprintf(buffer, "2026-01-21T%02d:%02d:%02dZ", hours, minutes, seconds);
  return String(buffer);
}

void publishData() {
  // Read ADC
  float adcValue = readADC_Averaged(10);
  
  // Read RO from EEPROM
  float ro = MQ137_RO_DEFAULT;
  EEPROM.get(0, ro);
  
  if (ro <= 0 || ro > 1000) {
    Serial.println("⚠️  Invalid RO in EEPROM, using default");
    ro = MQ137_RO_DEFAULT;
  }
  
  // Calculate ammonia
  float ammonia = calculateAmmonia(adcValue, ro, 25.0, 60.0);
  
  // Create JSON
  StaticJsonDocument<256> doc;
  doc["id"] = device_id;
  doc["ammonia"] = round(ammonia * 100) / 100.0;  // 2 decimals
  doc["temperature"] = 25.0;  // Placeholder
  doc["humidity"] = 60.0;     // Placeholder
  doc["timestamp"] = getISO8601Time();
  doc["adc_raw"] = (int)adcValue;  // Debug
  doc["ro"] = round(ro * 100) / 100.0;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  if (client.publish("iot/Station_1/ammonia", buffer)) {
    Serial.println("✅ Published: " + String(buffer));
  } else {
    Serial.println("❌ Publish failed");
  }
}

void loop() {
  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected, reconnecting...");
    setup_wifi();
  }
  
  // Reconnect MQTT if needed
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish data
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishData();
  }
  
  delay(1000);
}

/* ========================================
TROUBLESHOOTING CHECKLIST

❌ ADC Reading is 0:
  - Check GPIO34 is connected to sensor A0
  - Check sensor is powered (3.3V)
  - Try different ADC pin if available
  - Use multimeter to check voltage

❌ Ammonia Always 0:
  - RO calibration may be wrong
  - Sensor not warmed up (~5 min)
  - Check MQ-137 datasheet
  - Calibration must be in clean air

❌ DHT22 Not Reading:
  - Optional - code works without it
  - Check GPIO4 pin connection
  - Add pull-up resistor if needed
  - Or remove DHT code entirely

✅ NEXT STEPS:
  1. Upload this code
  2. Open Serial Monitor (115200 baud)
  3. Check debug output
  4. Verify ADC readings > 0
  5. Check ammonia values in dashboard
======================================== */
