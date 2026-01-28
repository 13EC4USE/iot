/*
Program Version 0.6 (Fixed for Pi Integration)
Date 2026/01/28
- แก้ไข MQTT topic เป็น iot/Station_1/ammonia
- เพิ่ม "id" field ใน JSON payload
- เปลี่ยน default MQTT server เป็น 192.168.1.104 (Pi)
- อ่านค่าจากเซนเซอร์ MQ-137 และ DHT22
- ชดเชยค่าตามอุณหภูมิและความชื้น
- แสดงผลบนจอ OLED
- ระบบ Deep Sleep เพื่อประหยัดพลังงาน
- ควบคุมการจ่ายไฟเซนเซอร์ด้วย Mosfet
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

// กำหนดขนาดจอ OLED 1.3 นิ้ว (128x64 pixels)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// กำหนด pin ที่ใช้เชื่อมต่อ
const int mq137Pin = 34;
const int dht22Pin = 25;
const int buttonPin = 33;
const int calibButtonPin = 13;
const int sensorPowerPin = 14;

// Device ID และ MQTT Topic
const char* DEVICE_ID = "Station_1";
const char* topic_prefix = "iot/";

// กำหนดค่าสำหรับ Deep Sleep
#define uS_TO_S_FACTOR 1000000ULL
#define M_TO_S_FACTOR 60ULL

// กำหนดค่า EEPROM
#define EEPROM_SIZE 512
#define CONFIG_ADDR 0
#define CALIBRATION_ADDR 300

// ตัวแปรที่เก็บในหน่วยความจำ RTC
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR float Ro = 10.0;
RTC_DATA_ATTR bool isCalibrated = false;

#define DHTTYPE DHT22

const float RL = 4.7;
const float VOLT_RESOLUTION = 3.3;
const float ADC_RESOLUTION = 4095.0;
const float REFERENCE_TEMP = 20.0;
const float REFERENCE_RH = 55.0;

DHT dht(dht22Pin, DHTTYPE);
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ตัวแปรสำหรับเก็บค่าที่ตั้งจาก WiFiManager
char mqtt_server[40] = "192.168.1.104";  // Pi IP
char sleep_time_str[8] = "20";
int sleep_time = 20;

const uint32_t SLEEP_TIME_MIN_MINUTES = 1;
const uint32_t SLEEP_TIME_MAX_MINUTES = 1440;

int sanitizeSleepTimeMinutes(int minutes) {
  if (minutes < (int)SLEEP_TIME_MIN_MINUTES) return (int)SLEEP_TIME_MIN_MINUTES;
  if (minutes > (int)SLEEP_TIME_MAX_MINUTES) return (int)SLEEP_TIME_MAX_MINUTES;
  return minutes;
}

unsigned long lastCalibrationTime = 0;
bool calibrationMode = false;
const unsigned long CALIB_TIMEOUT = 180000;

float lastTemperature = REFERENCE_TEMP;
float lastHumidity = REFERENCE_RH;

WiFiClient espClient;
PubSubClient client(espClient);

struct Config {
  char mqtt_server[40];
  int sleep_time;
  uint32_t crc;
};
Config config;

uint32_t calculateCRC32(const uint8_t *data, size_t length) {
  uint32_t crc = 0xffffffff;
  while (length--) {
    uint8_t c = *data++;
    for (uint32_t i = 0x80; i > 0; i >>= 1) {
      bool bit = crc & 0x80000000;
      if (c & i) {
        bit = !bit;
      }
      crc <<= 1;
      if (bit) {
        crc ^= 0x04c11db7;
      }
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
  if (crc != config.crc) {
    Serial.println("Config CRC mismatch, using default values");
    return false;
  }
  strlcpy(mqtt_server, config.mqtt_server, sizeof(mqtt_server));
  sleep_time = sanitizeSleepTimeMinutes(config.sleep_time);
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  return true;
}

void saveCalibrationData() {
  EEPROM.put(CALIBRATION_ADDR, Ro);
  EEPROM.commit();
  Serial.print("บันทึกค่า Ro = ");
  Serial.print(Ro, 4);
  Serial.println(" kOhm ลงใน EEPROM");
}

bool loadCalibrationData() {
  float storedRo;
  EEPROM.get(CALIBRATION_ADDR, storedRo);
  if (isnan(storedRo) || storedRo <= 0.0) {
    Serial.println("ไม่พบค่า Ro ที่ถูกต้องใน EEPROM");
    return false;
  }
  Ro = storedRo;
  isCalibrated = true;
  Serial.print("โหลดค่า Ro = ");
  Serial.print(Ro, 4);
  Serial.println(" kOhm จาก EEPROM");
  return true;
}

void saveParamCallback() {
  Serial.println("[WiFiManager] saveParamCallback");
  sleep_time = sanitizeSleepTimeMinutes(atoi(sleep_time_str));
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  saveConfig();
}

void setupWiFi(bool forceConfig) {
  WiFiManager wm;
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("WiFi Setup");
  display.println("Connect to AP:");
  display.println("MQ137-Setup");
  display.display();
  
  WiFiManagerParameter custom_mqtt_server("server", "MQTT Server IP", mqtt_server, 40);
  WiFiManagerParameter custom_sleep_time("sleep", "Deep Sleep Time (minutes)", sleep_time_str, 8);
  
  wm.addParameter(&custom_mqtt_server);
  wm.addParameter(&custom_sleep_time);
  wm.setSaveParamsCallback(saveParamCallback);
  
  bool res;
  if (forceConfig) {
    res = wm.startConfigPortal("MQ137-Setup", "password");
  } else {
    res = wm.autoConnect("MQ137-Setup", "password");
  }
  
  if (!res) {
    Serial.println("Failed to connect or timed out");
    ESP.restart();
  }
  
  strlcpy(mqtt_server, custom_mqtt_server.getValue(), sizeof(mqtt_server));
  strlcpy(sleep_time_str, custom_sleep_time.getValue(), sizeof(sleep_time_str));
  sleep_time = sanitizeSleepTimeMinutes(atoi(sleep_time_str));
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  saveConfig();
  
  Serial.println("WiFi Connected");
  Serial.print("MQTT Server: ");
  Serial.println(mqtt_server);
  Serial.print("Deep Sleep Time: ");
  Serial.println(sleep_time);
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("WiFi Connected");
  display.print("IP: ");
  display.println(WiFi.localIP());
  display.print("MQTT: ");
  display.println(mqtt_server);
  display.print("Sleep: ");
  display.print(sleep_time);
  display.println(" min");
  display.display();
  delay(2000);
}

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

void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(calibButtonPin, INPUT_PULLUP);
  pinMode(sensorPowerPin, OUTPUT);

  dht.begin();
  delay(3000);
  float temperature, humidity;
  bool tempReadSuccess = readTemperatureAndHumidity(temperature, humidity);

  if (tempReadSuccess) {
    Serial.printf("DHT22 OK: T=%.1f C, H=%.1f %%\n", temperature, humidity);
  } else {
    Serial.println("DHT22 FAILED at startup");
  }
  
  digitalWrite(sensorPowerPin, HIGH);
  Serial.println("เปิดไฟเซนเซอร์ผ่าน Mosfet");
  
  bootCount++;
  Serial.print("Boot number: ");
  Serial.println(bootCount);
  
  Wire.begin();
  display.begin(SCREEN_ADDRESS, true);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("MQ-137 & DHT22 SYSTEM");
  display.println("-------------------");
  display.print("Boot #");
  display.println(bootCount);
  display.print("Version 0.6 (Pi)");
  display.display();
  delay(1000);
  
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  
  if (!loadCalibrationData()) {
    isCalibrated = false;
    Ro = 10.0;
  }
  
  if (!loadConfig()) {
    strlcpy(mqtt_server, "192.168.1.104", sizeof(mqtt_server));
    sleep_time = 20;
    snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
    saveConfig();
  }
  
  bool forceConfig = isButtonPressed(buttonPin);
  
  if (isButtonPressed(calibButtonPin)) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Calibration Button");
    display.println("Detected");
    display.display();
    delay(1000);
    checkCalibrationButton();
  }
  
  if (forceConfig) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Config Button pressed");
    display.println("Force WiFi config");
    display.display();
    delay(2000);
  }
  
  setupWiFi(forceConfig);
  client.setServer(mqtt_server, 1883);
  
  if (bootCount == 1 || !isCalibrated) {
    warmUpSensor(120);
    calibrateSensor();
  } else {
    warmUpSensor(60);
  }
  
  measureAndSendData();
  startDeepSleep();
}

void loop() {
}

bool isButtonPressed(int pin) {
  return digitalRead(pin) == LOW;
}

void reconnectMQTT() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting to MQTT");
  display.print("Server: ");
  display.println(mqtt_server);
  display.display();
  
  Serial.print("Connecting to MQTT server... ");
  
  String clientId = "MQ137_";
  clientId += DEVICE_ID;
  
  if (client.connect(clientId.c_str())) {
    Serial.println("connected");
    display.println("Connected!");
    display.display();
    delay(1000);
  } else {
    Serial.print("failed, rc=");
    Serial.println(client.state());
    display.println("Failed to connect!");
    display.display();
    delay(2000);
  }
}

void startDeepSleep() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Entering deep sleep");
  display.print("for ");
  display.print(sleep_time);
  display.println(" minutes...");
  display.println("Turning off sensors");
  display.display();
  
  Serial.print("เข้าสู่โหมด Deep Sleep เป็นเวลา ");
  Serial.print(sleep_time);
  Serial.println(" นาที");
  
  digitalWrite(sensorPowerPin, LOW);
  Serial.println("ปิดไฟเซนเซอร์ผ่าน Mosfet");
  
  delay(3000);
  display.clearDisplay();
  display.display();
  
  uint64_t sleep_us = (uint64_t)sleep_time * M_TO_S_FACTOR * uS_TO_S_FACTOR;
  Serial.printf("Deep Sleep: %d min (%llu us)\n", sleep_time, (unsigned long long)sleep_us);
  esp_sleep_enable_timer_wakeup(sleep_us);
  esp_deep_sleep_start();
}

bool readTemperatureAndHumidity(float &temperature, float &humidity) {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ไม่สามารถอ่านค่าจากเซ็นเซอร์ DHT22 ได้!");
    return false;
  }
  
  lastTemperature = temperature;
  lastHumidity = humidity;
  return true;
}

float calibrateSensor() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Calibrating MQ-137...");
  display.println("Please wait...");
  display.display();
  
  Serial.println("เริ่มการปรับเทียบเซนเซอร์ MQ-137...");
  
  float temperature = lastTemperature;
  float humidity = lastHumidity;
  
  display.setCursor(0, 20);
  display.print("T: ");
  display.print(temperature, 1);
  display.print("C  H: ");
  display.print(humidity, 1);
  display.println("%");
  display.println("Sampling in clean air...");
  display.display();
  
  float rs = 0;
  const int numSamples = 10;
  
  for (int i = 0; i < numSamples; i++) {
    float currentRs = getSensorResistance();
    rs += currentRs;
    
    display.fillRect(0, 40, 128, 8, SH110X_BLACK);
    display.setCursor(0, 40);
    display.print("Sample ");
    display.print(i+1);
    display.print("/");
    display.print(numSamples);
    display.print(": ");
    display.print(currentRs, 2);
    display.println(" kOhm");
    display.display();
    
    Serial.print("ตัวอย่างที่ ");
    Serial.print(i+1);
    Serial.print(": Rs = ");
    Serial.print(currentRs, 4);
    Serial.println(" kOhm");
    
    delay(500);
  }
  
  rs = rs / numSamples;
  float compensatedRs = compensateRsForTemperatureAndHumidity(rs, temperature, humidity);
  float ro = compensatedRs / 9.8;
  
  display.fillRect(0, 40, 128, 24, SH110X_BLACK);
  display.setCursor(0, 40);
  display.print("Rs = ");
  display.print(compensatedRs, 2);
  display.println(" kOhm");
  display.setCursor(0, 50);
  display.print("Ro = ");
  display.print(ro, 2);
  display.println(" kOhm");
  display.display();
  
  Serial.print("ค่า Rs เฉลี่ย = ");
  Serial.print(rs, 4);
  Serial.println(" kOhm");
  Serial.print("ค่า Rs ที่ชดเชยแล้ว = ");
  Serial.print(compensatedRs, 4);
  Serial.println(" kOhm");
  Serial.print("ค่า Ro ที่คำนวณได้ = ");
  Serial.print(ro, 4);
  Serial.println(" kOhm");
  
  Ro = ro;
  saveCalibrationData();
  isCalibrated = true;
  
  display.setCursor(0, 60);
  display.println("Calibration done!");
  display.display();
  
  delay(3000);
  return ro;
}

float getSensorResistance() {
  int adcSum = 0;
  const int numReadings = 10;
  
  for (int i = 0; i < numReadings; i++) {
    adcSum += analogRead(mq137Pin);
    delay(10);
  }
  
  int adcValue = adcSum / numReadings;
  float vrl = adcValue * (VOLT_RESOLUTION / ADC_RESOLUTION);
  float rs;
  
  if (vrl < 0.001) {
    rs = 999.9;
  } else {
    rs = ((5.0 * RL) / vrl) - RL;
  }
  
  if (rs < 0) {
    rs = 0.001;
  }
  
  return rs;
}

float compensateRsForTemperatureAndHumidity(float rs, float temperature, float humidity) {
  float tempFactor = 1.0;
  
  if (temperature < REFERENCE_TEMP) {
    tempFactor = 1.0 + ((REFERENCE_TEMP - temperature) * 0.015);
  } else {
    tempFactor = 1.0 - ((temperature - REFERENCE_TEMP) * 0.015);
  }
  
  float humidityFactor = 1.0;
  
  if (humidity < REFERENCE_RH) {
    humidityFactor = 1.0 + ((REFERENCE_RH - humidity) * 0.0067);
  } else {
    humidityFactor = 1.0 - ((humidity - REFERENCE_RH) * 0.004);
  }
  
  float compensatedRs = rs / (tempFactor * humidityFactor);
  
  Serial.print("Rs เดิม: ");
  Serial.print(rs, 4);
  Serial.print(" kOhm, ตัวคูณชดเชยอุณหภูมิ: ");
  Serial.print(tempFactor, 4);
  Serial.print(" (");
  Serial.print(temperature, 1);
  Serial.print("°C), ตัวคูณชดเชยความชื้น: ");
  Serial.print(humidityFactor, 4);
  Serial.print(" (");
  Serial.print(humidity, 1);
  Serial.print("% RH), Rs ที่ชดเชยแล้ว: ");
  Serial.print(compensatedRs, 4);
  Serial.println(" kOhm");
  
  return compensatedRs;
}

float getPPM(float ratio) {
  const float a = 83.17;
  const float b = -1.52;
  
  if (ratio <= 0) {
    return 9999.99;
  }
  
  return a * pow(ratio, b);
}

void measureAndSendData() {
  float temperature, humidity;
  bool tempReadSuccess = readTemperatureAndHumidity(temperature, humidity);
  
  if (!tempReadSuccess) {
    temperature = lastTemperature;
    humidity = lastHumidity;
  }
  
  int adcSum = 0;
  for (int i = 0; i < 10; i++) {
    adcSum += analogRead(mq137Pin);
    delay(10);
  }
  int adcValue = adcSum / 10;
  
  float vrl = adcValue * (VOLT_RESOLUTION / ADC_RESOLUTION);
  float rs = ((5.0 * RL) / vrl) - RL;
  
  if (rs <= 0) {
    rs = 0.001;
  }
  
  float compensatedRs = compensateRsForTemperatureAndHumidity(rs, temperature, humidity);
  float ratio = compensatedRs / Ro;
  float ppm = getPPM(ratio);
  
  Serial.println("ค่าที่อ่านได้:");
  Serial.print("อุณหภูมิ: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("ความชื้น: ");
  Serial.print(humidity);
  Serial.println(" %RH");
  Serial.print("ADC Value: ");
  Serial.println(adcValue);
  Serial.print("VRL (V): ");
  Serial.println(vrl, 4);
  Serial.print("RS (kOhms): ");
  Serial.println(compensatedRs, 4);
  Serial.print("RS/Ro Ratio: ");
  Serial.println(ratio, 4);
  Serial.print("ความเข้มข้นแอมโมเนีย (ppm): ");
  Serial.println(ppm, 2);
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("T: ");
  display.print(temperature, 1);
  display.print("C  H: ");
  display.print(humidity, 1);
  display.println("%");
  
  display.drawLine(0, 10, 128, 10, SH110X_WHITE);
  
  display.setCursor(0, 14);
  display.print("VRL: ");
  display.print(vrl, 2);
  display.println("V");
  
  display.setCursor(0, 24);
  display.print("Rs: ");
  display.print(compensatedRs, 2);
  display.println(" kOhm");
  
  display.setCursor(0, 34);
  display.print("Rs/Ro: ");
  display.println(ratio, 3);
  
  display.setCursor(0, 46);
  display.print("NH3: ");
  display.setTextSize(2);
  display.setCursor(40, 46);
  display.print(ppm, 1);
  display.setTextSize(1);
  display.setCursor(108, 54);
  display.println("ppm");
  
  display.display();
  delay(5000);
  
  // สร้าง JSON พร้อม "id" field
  StaticJsonDocument<256> doc;
  doc["id"] = DEVICE_ID;  // เพิ่ม Device ID
  doc["ammonia"] = ppm;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["calibratedRo"] = Ro;
  
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("MQTT Status:");
  
  if (!client.connected()) {
    reconnectMQTT();
  }
  
  if (client.connected()) {
    // สร้าง topic: iot/Station_1/ammonia
    char topic[64];
    snprintf(topic, sizeof(topic), "%s%s/ammonia", topic_prefix, DEVICE_ID);
    
    client.publish(topic, jsonBuffer);
    display.println("Data sent OK");
    display.print("Topic: ");
    display.println(topic);
    Serial.println("Data sent via MQTT:");
    Serial.print("Topic: ");
    Serial.println(topic);
    Serial.println(jsonBuffer);
  } else {
    display.println("Failed to send data");
  }
  
  display.println("------");
  display.print("NH3: ");
  display.print(ppm, 1);
  display.println(" ppm");
  display.print("T:");
  display.print(temperature, 1);
  display.print("C  H:");
  display.print(humidity, 1);
  display.println("%");
  display.display();
  
  delay(2000);
}

void checkCalibrationButton() {
  if (isButtonPressed(calibButtonPin)) {
    delay(50);
    
    if (isButtonPressed(calibButtonPin)) {
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.println("Calibration Mode");
      display.println("Hold button for 3s");
      display.println("to confirm calibration");
      display.display();
      
      Serial.println("ตรวจพบการกดปุ่มคาลิเบรต");
      Serial.println("กดค้างเพื่อยืนยันการคาลิเบรต...");
      
      unsigned long startTime = millis();
      while (isButtonPressed(calibButtonPin)) {
        int progress = ((millis() - startTime) * 100) / 3000;
        progress = constrain(progress, 0, 100);
        
        display.fillRect(0, 40, 128, 10, SH110X_BLACK);
        display.drawRect(0, 40, 128, 10, SH110X_WHITE);
        display.fillRect(2, 42, (progress * 124) / 100, 6, SH110X_WHITE);
        
        display.fillRect(0, 52, 128, 8, SH110X_BLACK);
        display.setCursor(56, 52);
        display.print(progress);
        display.print("%");
        display.display();
        
        if (millis() - startTime >= 3000) {
          calibrationMode = true;
          lastCalibrationTime = millis();
          
          Serial.println("เริ่มโหมดคาลิเบรต");
          display.clearDisplay();
          display.setCursor(0, 0);
          display.println("Starting calibration");
          display.println("Please wait...");
          display.display();
          delay(1000);
          
          calibrateSensor();
          calibrationMode = false;
          break;
        }
        
        delay(50);
      }
      
      if (!calibrationMode) {
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("Calibration canceled");
        display.println("Button released too soon");
        display.display();
        Serial.println("ยกเลิกการคาลิเบรต: ปล่อยปุ่มเร็วเกินไป");
        delay(2000);
      }
    }
  }
}

void warmUpSensor(int warmupSeconds) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Warming up sensor");
  display.print("Please wait ");
  display.print(warmupSeconds);
  display.println(" sec");
  display.display();
  
  Serial.print("กำลังอุ่นเครื่องเซ็นเซอร์... ");
  Serial.print(warmupSeconds);
  Serial.println(" วินาที");
  
  for (int i = warmupSeconds; i > 0; i--) {
    display.fillRect(0, 20, 128, 20, SH110X_BLACK);
    display.setCursor(0, 20);
    display.print("Countdown: ");
    display.print(i);
    display.println(" sec");
    
    int progressWidth = map(warmupSeconds - i, 0, warmupSeconds, 0, 128);
    display.drawRect(0, 32, 128, 8, SH110X_WHITE);
    display.fillRect(0, 32, progressWidth, 8, SH110X_WHITE);
    
    display.display();
    
    Serial.print("เหลือเวลาอุ่นเครื่อง... ");
    Serial.print(i);
    Serial.println(" วินาที");
    
    delay(1000);
  }
  
  display.fillRect(0, 20, 128, 20, SH110X_BLACK);
  display.setCursor(0, 20);
  display.println("Sensor ready!");
  display.display();
  delay(1000);
}
