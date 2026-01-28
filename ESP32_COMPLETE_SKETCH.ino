/*
 * IoT Ammonia Monitor - ESP32
 * Reads DHT22 (temp/humidity) + MQ-137 (ammonia)
 * Sends to Pi MQTT broker: 192.168.1.142:1883
 * Topic: iot/Station_1/ammonia
 * 
 * Requirements:
 * - WiFiManager library
 * - PubSubClient (MQTT)
 * - DHT sensor library
 * - ArduinoJson library
 */

#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <time.h>

// ============================================
// ⚙️ Pin Configuration
// ============================================
#define DHTPIN 4           // GPIO4 - DHT22 data pin
#define DHTTYPE DHT22      // DHT 22 (AM2302)
#define MQ137_PIN 35       // GPIO35 (ADC) - MQ-137 analog pin
#define CONFIG_PIN 33      // GPIO33 - Press to reset WiFi config

// ============================================
// 📡 Device Configuration
// ============================================
const char* DEVICE_ID = "Station_1";
const char* MQTT_BROKER = "192.168.1.142";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_PREFIX = "iot/";

// ============================================
// 🔧 Sensor & Timing
// ============================================
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Calibration values for MQ-137
const float RO_CLEAN_AIR_FACTOR = 5.0;  // Rs/R0 in clean air
float calibration_voltage = 3.3;        // ADC reference voltage
int sensor_adc_resolution = 4095;       // 12-bit ADC
float R0 = 10000.0;                     // Baseline resistance (ohms)

// Timing
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_READ_INTERVAL = 5000;  // 5 seconds
unsigned long lastMqttCheck = 0;
const unsigned long MQTT_CHECK_INTERVAL = 10000;  // 10 seconds

// ============================================
// 🔧 Function Declarations
// ============================================
void setupWiFi();
void checkConfigButton();
void connectMQTT();
void measureAndPublish();
float readAmmonia();
float calibrateRO();
String getTimestamp();
void onMqttMessage(char* topic, byte* payload, unsigned int length);

// ============================================
// ⚡ Setup
// ============================================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n");
  Serial.println("🚀 IoT Ammonia Monitor - ESP32");
  Serial.println("================================");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("MQTT Broker: ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);
  Serial.println("================================\n");

  // Pin setup
  pinMode(CONFIG_PIN, INPUT_PULLUP);
  pinMode(MQ137_PIN, INPUT);

  // Initialize sensors
  dht.begin();
  Serial.println("✅ DHT22 sensor initialized");

  // Calibrate MQ-137
  Serial.println("📊 Calibrating MQ-137 sensor (please wait 30 seconds)...");
  R0 = calibrateRO();
  Serial.print("✅ MQ-137 calibrated. R0 = ");
  Serial.println(R0);

  // WiFi setup
  setupWiFi();

  // MQTT setup
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(onMqttMessage);

  // Sync time from NTP
  Serial.println("🕐 Syncing time from NTP...");
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  delay(2000);

  Serial.println("✅ Setup complete! Starting measurement loop...\n");
}

// ============================================
// 🔄 Main Loop
// ============================================
void loop() {
  // Check config button
  checkConfigButton();

  // Keep MQTT connected
  if (!client.connected()) {
    unsigned long now = millis();
    if (now - lastMqttCheck >= MQTT_CHECK_INTERVAL) {
      connectMQTT();
      lastMqttCheck = now;
    }
  } else {
    client.loop();  // Process MQTT messages
  }

  // Read and publish sensors
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    measureAndPublish();
    lastSensorRead = now;
  }

  delay(100);  // Small delay to prevent watchdog timeout
}

// ============================================
// 📡 WiFi Setup with WiFiManager
// ============================================
void setupWiFi() {
  Serial.println("📶 Starting WiFi configuration...");

  WiFiManager wifim;
  
  // Optional: reset settings (uncomment to clear stored WiFi)
  // wifim.resetSettings();

  // Connect to WiFi (opens portal if not configured)
  if (wifim.autoConnect("IoT-Ammonia-Setup")) {
    Serial.println("✅ WiFi connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("   SSID: ");
    Serial.println(WiFi.SSID());
  } else {
    Serial.println("❌ WiFi connection failed");
    Serial.println("   Entering AP mode. Connect to 'IoT-Ammonia-Setup'");
  }
}

// ============================================
// 🔘 Config Button Handler
// ============================================
void checkConfigButton() {
  static unsigned long lastPress = 0;
  
  if (digitalRead(CONFIG_PIN) == LOW) {
    // Button pressed
    if (millis() - lastPress > 3000) {  // Hold for 3 seconds
      Serial.println("🔄 Config button pressed! Resetting WiFi settings...");
      
      WiFiManager wifim;
      wifim.resetSettings();
      ESP.restart();
      
      lastPress = millis();
    }
  }
}

// ============================================
// 📊 Sensor Readings
// ============================================
void measureAndPublish() {
  Serial.println("\n📥 Reading sensors...");

  // Read DHT22
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Read MQ-137
  float ammonia_ppm = readAmmonia();
  float calibrated_ro = R0;

  // Check if reads are valid
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("❌ DHT22 read failed!");
    return;
  }

  // Print readings
  Serial.print("   Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("   Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("   Ammonia: ");
  Serial.print(ammonia_ppm);
  Serial.println(" ppm");

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["id"] = DEVICE_ID;
  doc["ammonia"] = ammonia_ppm;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["calibratedRo"] = calibrated_ro;
  doc["timestamp"] = getTimestamp();
  doc["battery"] = 100;  // TODO: read battery voltage

  // Serialize to string
  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  if (client.connected()) {
    String topic = String(MQTT_TOPIC_PREFIX) + String(DEVICE_ID) + "/ammonia";
    
    if (client.publish(topic.c_str(), payload.c_str())) {
      Serial.print("📤 Published to: ");
      Serial.println(topic);
      Serial.print("   Payload: ");
      Serial.println(payload);
    } else {
      Serial.println("❌ MQTT publish failed!");
    }
  } else {
    Serial.println("⚠️  Not connected to MQTT. Buffering data...");
  }
}

// ============================================
// 💨 Ammonia Sensor (MQ-137)
// ============================================
float readAmmonia() {
  // Read ADC value
  int adc_value = analogRead(MQ137_PIN);
  
  // Convert ADC to voltage
  float voltage = (adc_value / (float)sensor_adc_resolution) * calibration_voltage;
  
  // Calculate Rs (sensor resistance)
  float Rs = (calibration_voltage - voltage) / voltage * 10000.0;  // RL = 10k
  
  // Calculate ppm
  // Formula: ppm = a * (Rs/R0)^b
  // For MQ-137 (ammonia): a=0.53, b=-3.16 (typical values)
  float ratio = Rs / R0;
  float ppm = 0.53 * pow(ratio, -3.16);
  
  return ppm;
}

float calibrateRO() {
  // Measure Rs in clean air for 30 seconds
  float sum_rs = 0;
  int samples = 30;
  
  for (int i = 0; i < samples; i++) {
    int adc_value = analogRead(MQ137_PIN);
    float voltage = (adc_value / (float)sensor_adc_resolution) * calibration_voltage;
    float Rs = (calibration_voltage - voltage) / voltage * 10000.0;
    sum_rs += Rs;
    
    Serial.print(".");
    delay(1000);
  }
  
  Serial.println();
  float avg_rs = sum_rs / samples;
  float R0 = avg_rs / RO_CLEAN_AIR_FACTOR;
  
  return R0;
}

// ============================================
// 📡 MQTT Functions
// ============================================
void connectMQTT() {
  if (client.connected()) {
    return;
  }

  Serial.println("🔗 Connecting to MQTT broker...");
  
  // Create client ID
  String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
  
  if (client.connect(clientId.c_str())) {
    Serial.print("✅ MQTT connected! Client ID: ");
    Serial.println(clientId);
    
    // Subscribe to config topic (optional)
    String configTopic = String(MQTT_TOPIC_PREFIX) + String(DEVICE_ID) + "/config";
    client.subscribe(configTopic.c_str());
    
  } else {
    Serial.print("❌ MQTT connection failed. State: ");
    Serial.println(client.state());
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("📨 Message received on topic: ");
  Serial.println(topic);
  
  // Parse JSON payload (optional)
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  
  // Handle config updates here if needed
}

// ============================================
// 🕐 Timestamp Generator
// ============================================
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", timeinfo);
  
  return String(buffer);
}

// ============================================
// 🔧 Utility Functions
// ============================================
void printSystemInfo() {
  Serial.println("\n📊 System Information:");
  Serial.print("   WiFi SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("   WiFi IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("   WiFi Signal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("   MQTT Broker: ");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.println(MQTT_PORT);
  Serial.print("   MQTT Status: ");
  Serial.println(client.connected() ? "Connected" : "Disconnected");
}
