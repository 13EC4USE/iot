/*
Program Version 0.7 (Hotspot IP Fixed + Variables Fixed)
Date 2026/01/22
- เปลี่ยน MQTT Server เป็น 10.105.178.189 (Pi/Hotspot)
- ตั้งค่า Topic เป็น iot/Station_1/ammonia ให้ตรงกับ data_logger
- แก้ lastTemperature / lastHumidity
- คงค่า ID "Station_1"
*/

#include <Arduino.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// --- ตั้งค่า Hardware ---
const int mq137Pin = 34;
const int dht22Pin = 25;
const int buttonPin = 33;       // ปุ่ม Config WiFi
const int calibButtonPin = 13;
const int sensorPowerPin = 14;

// --- ตั้งค่า IP Hotspot/Pi ---
const char* DEVICE_ID = "Station_1";
char mqtt_server[40] = "192.168.1.104";  // Local IP ของ Pi (ไม่ใช่ Tailscale)
const int mqtt_port = 1883;
const char* topic_prefix = "iot/"; // จะได้ topic = iot/Station_1/ammonia

char sleep_time_str[8] = "2";
int sleep_time = 2;

// กำหนดขนาดจอ OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// กำหนดค่า Time Unit
#define uS_TO_S_FACTOR 1000000ULL
#define M_TO_S_FACTOR 60ULL

// กำหนดค่า EEPROM
#define EEPROM_SIZE 512
#define CONFIG_ADDR 0
#define CALIBRATION_ADDR 300

// ตัวแปร RTC (ไม่หายเมื่อ Deep Sleep)
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR float Ro = 10.0;
RTC_DATA_ATTR bool isCalibrated = false;

// กำหนดค่า Sensor
#define DHTTYPE DHT22
const float RL = 4.7;
const float VOLT_RESOLUTION = 3.3;
const float ADC_RESOLUTION = 4095.0;
const float REFERENCE_TEMP = 20.0;
const float REFERENCE_RH = 55.0;

float lastTemperature = REFERENCE_TEMP;
float lastHumidity = REFERENCE_RH;

const uint32_t SLEEP_TIME_MIN_MINUTES = 1;
const uint32_t SLEEP_TIME_MAX_MINUTES = 1440;

DHT dht(dht22Pin, DHTTYPE);
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WiFiClient espClient;
PubSubClient client(espClient);

struct Config {
  char mqtt_server[40];
  int sleep_time;
  uint32_t crc;
};
Config config;

// --- Helper Functions ---
int sanitizeSleepTimeMinutes(int minutes) {
  if (minutes < (int)SLEEP_TIME_MIN_MINUTES) return (int)SLEEP_TIME_MIN_MINUTES;
  if (minutes > (int)SLEEP_TIME_MAX_MINUTES) return (int)SLEEP_TIME_MAX_MINUTES;
  return minutes;
}

uint32_t calculateCRC32(const uint8_t *data, size_t length) {
  uint32_t crc = 0xffffffff;
  while (length--) {
    uint8_t c = *data++;
    for (uint32_t i = 0x80; i > 0; i >>= 1) {
      bool bit = crc & 0x80000000;
      if (c & i) { bit = !bit; }
      crc <<= 1;
      if (bit) { crc ^= 0x04c11db7; }
    }
  }
  return crc;
}

void saveConfig() {
  sleep_time = sanitizeSleepTimeMinutes(sleep_time);
  config.sleep_time = sleep_time;
  strlcpy(config.mqtt_server, mqtt_server, sizeof(config.mqtt_server));
  config.crc = calculateCRC32((uint8_t*)&config, sizeof(Config) - sizeof(uint32_t));
  EEPROM.put(CONFIG_ADDR, config);
  EEPROM.commit();
}

bool loadConfig() {
  EEPROM.get(CONFIG_ADDR, config);
  uint32_t crc = calculateCRC32((uint8_t*)&config, sizeof(Config) - sizeof(uint32_t));
  if (crc != config.crc) return false;
  strlcpy(mqtt_server, config.mqtt_server, sizeof(mqtt_server));
  sleep_time = sanitizeSleepTimeMinutes(config.sleep_time);
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  return true;
}

void saveCalibrationData() { EEPROM.put(CALIBRATION_ADDR, Ro); EEPROM.commit(); }

bool loadCalibrationData() {
  float storedRo; EEPROM.get(CALIBRATION_ADDR, storedRo);
  if (isnan(storedRo) || storedRo <= 0.0) return false;
  Ro = storedRo; isCalibrated = true; return true;
}

void saveParamCallback() {
  sleep_time = sanitizeSleepTimeMinutes(atoi(sleep_time_str));
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  saveConfig();
}

// Forward Declaration
bool isButtonPressed(int pin);
void reconnectMQTT();
void startDeepSleep();
bool readTemperatureAndHumidity(float &temperature, float &humidity);
float calibrateSensor();
float getSensorResistance();
float compensateRsForTemperatureAndHumidity(float rs, float temperature, float humidity);
float getPPM(float ratio);
void measureAndSendData();
void checkCalibrationButton();
void warmUpSensor(int warmupSeconds);

// --- Setup WiFi ---
void setupWiFi(bool forceConfig) {
  WiFiManager wm;
  display.clearDisplay(); display.setCursor(0,0);
  display.println("WiFi Setup...");
  if(forceConfig) display.println("Connect AP: MQ137-Setup");
  display.display();

  WiFiManagerParameter custom_mqtt_server("server", "MQTT IP", mqtt_server, 40);
  WiFiManagerParameter custom_sleep_time("sleep", "Sleep(min)", sleep_time_str, 8);
  wm.addParameter(&custom_mqtt_server);
  wm.addParameter(&custom_sleep_time);
  wm.setSaveParamsCallback(saveParamCallback);

  bool res;
  if (forceConfig) {
    res = wm.startConfigPortal("MQ137-Setup", "password");
  } else {
    res = wm.autoConnect("MQ137-Setup", "password");
  }

  if (!res) { ESP.restart(); }

  strlcpy(mqtt_server, custom_mqtt_server.getValue(), sizeof(mqtt_server));
  strlcpy(sleep_time_str, custom_sleep_time.getValue(), sizeof(sleep_time_str));
  sleep_time = sanitizeSleepTimeMinutes(atoi(sleep_time_str));
  saveConfig();
}

void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(calibButtonPin, INPUT_PULLUP);
  pinMode(sensorPowerPin, OUTPUT);
  digitalWrite(sensorPowerPin, HIGH);
  
  bootCount++;
  Wire.begin();
  display.begin(SCREEN_ADDRESS, true);
  display.clearDisplay(); display.setTextColor(SH110X_WHITE); display.setTextSize(1);
  
  dht.begin();
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  if (!loadCalibrationData()) { isCalibrated = false; Ro = 10.0; }
  
  // ใช้ IP Hotspot เป็นค่าเริ่มต้นถ้าโหลด Config ไม่ผ่าน
  if (!loadConfig()) {
     strlcpy(mqtt_server, "10.105.178.189", sizeof(mqtt_server)); 
     saveConfig();
  }
  
  // 🔧 Force reset MQTT server ถ้าเป็น Tailscale IP
  if (strstr(mqtt_server, "100.") != NULL) {
    Serial.println("⚠️ Detected Tailscale IP, resetting to local IP...");
    strlcpy(mqtt_server, "10.105.178.189", sizeof(mqtt_server));
    saveConfig();
  }

  bool forceConfig = isButtonPressed(buttonPin);
  if (isButtonPressed(calibButtonPin)) { checkCalibrationButton(); }

  setupWiFi(forceConfig);
  client.setServer(mqtt_server, mqtt_port);
  Serial.print("MQTT server: ");
  Serial.print(mqtt_server);
  Serial.print(":");
  Serial.println(mqtt_port);

  if (bootCount == 1 || !isCalibrated) {
    Serial.println("Warmup + Calibrate start (120s)");
    warmUpSensor(120);
    Serial.println("Calibrate start");
    calibrateSensor();
    Serial.println("Calibrate done");
  } else {
    Serial.println("Warmup start (60s)");
    warmUpSensor(60);
  }

  Serial.println("Measure + Publish start");
  measureAndSendData();
  Serial.println("Measure + Publish done -> DeepSleep");
  startDeepSleep();
}

void loop() {}

bool isButtonPressed(int pin) { return digitalRead(pin) == LOW; }

void reconnectMQTT() {
  for(int i=0; i<3; i++) {
    Serial.print("MQTT connect try "); Serial.println(i+1);
    if (client.connect("MQ137Client")) {
      Serial.println("MQTT connected");
      return;
    }
    Serial.print("MQTT connect failed, state=");
    Serial.println(client.state());
    delay(1500);
  }
}

void startDeepSleep() {
  digitalWrite(sensorPowerPin, LOW);
  display.clearDisplay(); display.setCursor(0,0);
  display.print("Sleep "); display.print(sleep_time); display.println(" min");
  display.display(); delay(2000); display.clearDisplay(); display.display();
  uint64_t sleep_us = (uint64_t)sleep_time * M_TO_S_FACTOR * uS_TO_S_FACTOR;
  esp_sleep_enable_timer_wakeup(sleep_us);
  esp_deep_sleep_start();
}

bool readTemperatureAndHumidity(float &t, float &h) {
  h = dht.readHumidity(); t = dht.readTemperature();
  if (isnan(h) || isnan(t)) return false;
  lastTemperature = t; lastHumidity = h; return true;
}

float calibrateSensor() {
  float rs = 0;
  for (int i=0; i<10; i++) { rs += getSensorResistance(); delay(100); }
  rs /= 10.0;
  float t, h; if(!readTemperatureAndHumidity(t, h)) { t=REFERENCE_TEMP; h=REFERENCE_RH; }
  float compRs = compensateRsForTemperatureAndHumidity(rs, t, h);
  Ro = compRs / 9.8;
  saveCalibrationData(); isCalibrated = true; return Ro;
}

float getSensorResistance() {
  int sum = 0; for(int i=0; i<10; i++) { sum += analogRead(mq137Pin); delay(10); }
  float vrl = (sum/10.0) * (VOLT_RESOLUTION / ADC_RESOLUTION);
  if (vrl < 0.001) return 999.9;
  return ((5.0 * RL) / vrl) - RL;
}

float compensateRsForTemperatureAndHumidity(float rs, float t, float h) {
  float tf = (t < REFERENCE_TEMP) ? 1.0 + ((REFERENCE_TEMP-t)*0.015) : 1.0 - ((t-REFERENCE_TEMP)*0.015);
  float hf = (h < REFERENCE_RH) ? 1.0 + ((REFERENCE_RH-h)*0.0067) : 1.0 - ((h-REFERENCE_RH)*0.004);
  return rs / (tf * hf);
}

float getPPM(float ratio) {
  if (ratio <= 0) return 0;
  return 83.17 * pow(ratio, -1.52);
}

void measureAndSendData() {
  float t, h;
  if (!readTemperatureAndHumidity(t, h)) { t=lastTemperature; h=lastHumidity; }
  float ppm = getPPM(compensateRsForTemperatureAndHumidity(getSensorResistance(), t, h) / Ro);

  StaticJsonDocument<256> doc;
  doc["id"] = DEVICE_ID; 
  doc["ammonia"] = ppm;
  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["calibratedRo"] = Ro;
  char buf[256]; serializeJson(doc, buf);

  if (!client.connected()) reconnectMQTT();
  client.loop();
  if (client.connected()) {
    String topic = String(topic_prefix) + String(DEVICE_ID) + "/ammonia";
    client.publish(topic.c_str(), buf);
    display.clearDisplay(); display.setCursor(0,0);
    display.println("Sent OK!");
    display.print("NH3: "); display.print(ppm, 1); display.println(" ppm");
    display.print("T: "); display.print(t, 1); display.print("C");
    display.print("  H: "); display.print(h, 0); display.println("%");
    display.print("Ro: "); display.print(Ro, 1); display.println(" k");
    display.display(); delay(2000);
    Serial.print("Published to "); Serial.println(topic);
    Serial.println(buf);
  } else {
    Serial.println("MQTT not connected, skip publish");
  }
}

void checkCalibrationButton() {
  unsigned long s = millis();
  while(isButtonPressed(calibButtonPin)) {
    if(millis()-s > 3000) { calibrateSensor(); break; }
    delay(100);
  }
}

void warmUpSensor(int s) {
  for(int i=s; i>0; i--) {
    display.clearDisplay(); display.setCursor(0,0);
    display.print("Warmup: "); display.println(i); display.display(); delay(1000);
    if (i % 10 == 0 || i <= 5) { Serial.print("Warmup remaining: "); Serial.println(i); }
  }
}
