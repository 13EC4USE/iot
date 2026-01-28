/*
Program Version 0.5 - Modified for Local Pi MQTT
Date 2026/01/20
- อ่านค่าจากเซนเซอร์ MQ-137 และ DHT22
- ชดเชยค่าตามอุณหภูมิและความชื้น
- แสดงผลบนจอ OLED
- ระบบ Deep Sleep เพื่อประหยัดพลังงาน
- ควบคุมการจ่ายไฟเซนเซอร์ด้วย Mosfet ใช้ตัดไฟออกจาก MQ-137 อยู่ที่ขา14
- การปรับเทียบเซนเซอร์
- การเชื่อมต่อ WiFi และ MQTT
- ส่งข้อมูลไป Pi Local (192.168.1.142:1883) แทนเซิร์ฟเวอร์อาจารย์ (สำหรับทดสอบ)
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

// ===== กำหนดค่าสำหรับ Local Pi MQTT (เพิ่มใหม่) =====
const char* DEVICE_ID = "Station_1";
const char* LOCAL_MQTT_BROKER = "192.168.1.142";
const int LOCAL_MQTT_PORT = 1883;
const char* LOCAL_MQTT_TOPIC_PREFIX = "iot/";

// กำหนดขนาดจอ OLED 1.3 นิ้ว (128x64 pixels)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// กำหนด pin ที่ใช้เชื่อมต่อ
const int mq137Pin = 34;       // GPIO pin สำหรับ MQ-137 (AO)
const int dht22Pin = 25;       // GPIO pin สำหรับ DHT22
const int buttonPin = 33;       // GPIO pin สำหรับปุ่มกดตั้งค่า WiFi
const int calibButtonPin = 13;  // GPIO pin สำหรับปุ่มกดปรับเทียบเซนเซอร์ ไว้ทำการ calibate หัวอ่าน
const int sensorPowerPin = 14;  // GPIO pin สำหรับควบคุม Mosfet


// กำหนดค่าสำหรับ Deep Sleep
// 1 นาทีมี 60 วินาที  สูตรคำนวนธรรมดา เปลี่ยนเป็น 64bit เพราะ32บิตไม่พอหากตั้งเวลาเกิน 30 นาทีจะเกิด overflow ของตัวแปร
#define uS_TO_S_FACTOR 1000000ULL  // แปลงไมโครวินาทีเป็นวินาที (uint64)
#define M_TO_S_FACTOR 60ULL        // แปลงนาทีเป็นวินาที (uint64)

// กำหนดค่า EEPROM
#define EEPROM_SIZE 512
#define CONFIG_ADDR 0
#define CALIBRATION_ADDR 300    // ตำแหน่งเก็บค่าการปรับเทียบ Ro

// ตัวแปรที่เก็บในหน่วยความจำ RTC (จะไม่หายไประหว่าง deep sleep)
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR float Ro = 10.0;  // ค่าเริ่มต้น
RTC_DATA_ATTR bool isCalibrated = false;

// กำหนดประเภทของ DHT sensor
#define DHTTYPE DHT22

// กำหนดค่าคงที่สำหรับการคำนวณจาก datasheet ดูมาจากกราฟของ Mq-137 ที่อุณหภูมิห้อง
const float RL = 4.7;           // ค่าความต้านทานโหลด (kOhms) ตาม datasheet
const float VOLT_RESOLUTION = 3.3; // แรงดันอ้างอิงของ ESP32 (V)
const float ADC_RESOLUTION = 4095.0; // ความละเอียด ADC ของ ESP32 (12-bit)

// ค่าอุณหภูมิและความชื้นอ้างอิง (ตามที่ระบุใน datasheet - 20°C, 55% RH)
const float REFERENCE_TEMP = 20.0;
const float REFERENCE_RH = 55.0;

// สร้างอ็อบเจกต์ DHT
DHT dht(dht22Pin, DHTTYPE);

// สร้างอ็อบเจกต์ OLED
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ตัวแปรสำหรับเก็บค่าที่ตั้งจาก WiFiManager
char mqtt_server[40] = "sci-iot.ddns.net";  // ค่าเริ่มต้น (ของอาจารย์)
char sleep_time_str[8] = "2";              // ค่าเริ่มต้น: 2 นาที
int sleep_time = 2;                        // เวลา deep sleep เป็นนาที

// ขอบเขตเวลา Deep Sleep (นาที) - ป้องกันค่าผิดพลาดจากการตั้งค่า
const uint32_t SLEEP_TIME_MIN_MINUTES = 1;        // ขั้นต่ำ 1 นาที
const uint32_t SLEEP_TIME_MAX_MINUTES = 1440;     // สูงสุด 24 ชั่วโมง

// ตรวจสอบ/ปรับค่าที่รับมาจาก ConfigPortal/EEPROM ให้สมเหตุสมผล
int sanitizeSleepTimeMinutes(int minutes) {
  if (minutes < (int)SLEEP_TIME_MIN_MINUTES) return (int)SLEEP_TIME_MIN_MINUTES;
  if (minutes > (int)SLEEP_TIME_MAX_MINUTES) return (int)SLEEP_TIME_MAX_MINUTES;
  return minutes;
}


// ตัวแปรสำหรับการคาลิเบรต
unsigned long lastCalibrationTime = 0;
bool calibrationMode = false;
const unsigned long CALIB_TIMEOUT = 180000; // เวลาที่ระบบสามารถอยู่ในโหมดคาลิเบรตได้ (milliseconds) - 3 นาที

// ตัวแปรสำหรับการอ่านค่าเซนเซอร์
float lastTemperature = REFERENCE_TEMP;
float lastHumidity = REFERENCE_RH;

// ตัวแปรสำหรับ MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// โครงสร้างสำหรับเก็บค่าตั้งค่า
struct Config {
  char mqtt_server[40];
  int sleep_time;
  uint32_t crc;  // ใช้สำหรับตรวจสอบความถูกต้องของข้อมูล
};
Config config;

// ฟังก์ชันสำหรับคำนวณ CRC32
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

// ฟังก์ชันสำหรับบันทึกค่าตั้งค่าลงใน EEPROM
void saveConfig() {
  sleep_time = sanitizeSleepTimeMinutes(sleep_time);
  config.sleep_time = sleep_time;
  strlcpy(config.mqtt_server, mqtt_server, sizeof(config.mqtt_server));
  
  // คำนวณ CRC ก่อนบันทึก
  config.crc = calculateCRC32((uint8_t*)&config, sizeof(Config) - sizeof(uint32_t));
  
  EEPROM.put(CONFIG_ADDR, config);
  EEPROM.commit();
}

// ฟังก์ชันสำหรับโหลดค่าตั้งค่าจาก EEPROM
bool loadConfig() {
  EEPROM.get(CONFIG_ADDR, config);
  
  // ตรวจสอบความถูกต้องของข้อมูลด้วย CRC
  uint32_t crc = calculateCRC32((uint8_t*)&config, sizeof(Config) - sizeof(uint32_t));
  if (crc != config.crc) {
    Serial.println("Config CRC mismatch, using default values");
    return false;
  }
  
  // นำค่าที่โหลดมาใช้งาน
  strlcpy(mqtt_server, config.mqtt_server, sizeof(mqtt_server));
  sleep_time = sanitizeSleepTimeMinutes(config.sleep_time);
  
  // แปลงค่า sleep_time เป็นสตริงสำหรับแสดงใน WiFiManager
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  
  return true;
}

// ฟังก์ชันบันทึกค่า Ro ลงใน EEPROM
void saveCalibrationData() {
  EEPROM.put(CALIBRATION_ADDR, Ro);
  EEPROM.commit();
  Serial.print("บันทึกค่า Ro = ");
  Serial.print(Ro, 4);
  Serial.println(" kOhm ลงใน EEPROM");
}

// ฟังก์ชันโหลดค่า Ro จาก EEPROM
bool loadCalibrationData() {
  float storedRo;
  EEPROM.get(CALIBRATION_ADDR, storedRo);
  
  // ตรวจสอบว่าค่ามีความสมเหตุสมผลหรือไม่ (ไม่ใช่ค่า NaN หรือค่าติดลบ)
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

// ฟังก์ชันที่ถูกเรียกเมื่อ WiFiManager บันทึกค่าตั้งค่า
void saveParamCallback() {
  Serial.println("[WiFiManager] saveParamCallback");
  sleep_time = sanitizeSleepTimeMinutes(atoi(sleep_time_str));
  // sync กลับไปเป็นสตริง (กันกรณีผู้ใช้ใส่ 0/ค่ามหาศาล)
  snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
  saveConfig();
}

// ฟังก์ชันสำหรับตั้งค่า WiFi ใหม่เมื่อกดปุ่ม
void setupWiFi(bool forceConfig) {
  WiFiManager wm;
  
  // แสดงข้อความบนจอ OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("WiFi Setup");
  display.println("Connect to AP:");
  display.println("MQ137-Setup");
  display.display();
  
  WiFiManagerParameter custom_mqtt_server("server", "MQTT Server IP", LOCAL_MQTT_BROKER, 40);
  
  wm.addParameter(&custom_mqtt_server);
  
  // ตั้งชื่อ AP และรหัสผ่าน
  bool res;
  if (forceConfig) {
    res = wm.startConfigPortal("MQ137-Setup", "password");
  } else {
    res = wm.autoConnect("MQ137-Setup", "password");
  }
  
  if (!res) {
    Serial.println("Failed to connect or timed out");
    // ถ้าเชื่อมต่อไม่สำเร็จ ให้รีสตาร์ท ESP
    ESP.restart();
  }
  
  Serial.println("WiFi Connected");
  Serial.print("Broker: ");
  Serial.println(LOCAL_MQTT_BROKER);
  
  // แสดงสถานะการเชื่อมต่อบนจอ OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("WiFi Connected");
  display.print("IP: ");
  display.println(WiFi.localIP());
  display.print("MQTT: ");
  display.println(LOCAL_MQTT_BROKER);
  display.display();
  
  delay(2000);
}

// ฟังก์ชันสร้าง timestamp จาก millis() (เพิ่มใหม่)
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
  
  // เริ่มต้น EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // ตั้งค่า GPIO
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(calibButtonPin, INPUT_PULLUP);
  pinMode(sensorPowerPin, OUTPUT);
  
  // เปิดไฟเซนเซอร์
  digitalWrite(sensorPowerPin, HIGH);
  Serial.println("เปิดไฟเซนเซอร์ผ่าน Mosfet");
  
  // เพิ่มจำนวนการบูต
  bootCount++;
  Serial.print("Boot number: ");
  Serial.println(bootCount);
  
  // เริ่มต้นใช้งาน OLED
  Wire.begin();
  display.begin(SCREEN_ADDRESS, true); // true = reset OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("MQ-137 & DHT22 SYSTEM");
  display.println("-------------------");
  display.print("Boot #");
  display.println(bootCount);
  display.print("Version 0.5 (Pi Local)");
  display.display();
  delay(1000);
  
  // เริ่มต้นใช้งาน DHT22
  dht.begin();
  
  // ตั้งค่า ADC ให้เหมาะสมกับการอ่านค่าเซนเซอร์
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  
  // โหลดค่า Ro จาก EEPROM
  if (!loadCalibrationData()) {
    isCalibrated = false;
    Ro = 10.0; // ค่าเริ่มต้นถ้าไม่มีการปรับเทียบ
  }
  
  // โหลดค่าตั้งค่าจาก EEPROM
  if (!loadConfig()) {
    // ถ้าโหลดไม่สำเร็จ ให้ใช้ค่าเริ่มต้น
    strlcpy(mqtt_server, "sci-iot.ddns.net", sizeof(mqtt_server));
    sleep_time = 2;
    snprintf(sleep_time_str, sizeof(sleep_time_str), "%d", sleep_time);
    saveConfig();
  }
  
  // ตรวจสอบการกดปุ่มเพื่อตั้งค่า WiFi ใหม่
  bool forceConfig = isButtonPressed(buttonPin);
  
  // ตรวจสอบการกดปุ่มคาลิเบรต
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
  
  // ตั้งค่า WiFi
  setupWiFi(forceConfig);
  
  // ตั้งค่า MQTT (เชื่อมต่อ Pi Local)
  client.setServer(LOCAL_MQTT_BROKER, LOCAL_MQTT_PORT);
  
  // ในการบูตครั้งแรก หรือถ้ายังไม่เคยปรับเทียบ ทำการปรับเทียบเซนเซอร์
  if (bootCount == 1 || !isCalibrated) {
    warmUpSensor(120); // อุ่นเครื่อง 2 นาทีสำหรับการคาลิเบรตครั้งแรก
    calibrateSensor();
  } else {
    // ในกรณีตื่นจาก deep sleep
    warmUpSensor(60); // อุ่นเครื่อง 60 วินาทีก่อนการวัดค่า
  }
  
  // วัดค่าและส่งข้อมูลผ่าน MQTT
  measureAndSendData();
  
  // หลังจากทำงานเสร็จ ให้เข้าสู่โหมด Deep Sleep
  startDeepSleep();
}

void loop() {
  // โค้ดในส่วน loop จะไม่ทำงานเนื่องจากเราใช้ Deep Sleep
}

// ฟังก์ชันตรวจสอบการกดปุ่ม
bool isButtonPressed(int pin) {
  return digitalRead(pin) == LOW;  // ปุ่มกดแบบ active low
}

// ฟังก์ชันเชื่อมต่อกับ MQTT Server
void reconnectMQTT() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting to MQTT");
  display.print("Server: ");
  display.println(LOCAL_MQTT_BROKER);
  display.display();
  
  Serial.print("Connecting to MQTT server ");
  Serial.print(LOCAL_MQTT_BROKER);
  Serial.print(":");
  Serial.print(LOCAL_MQTT_PORT);
  Serial.println("...");
  
  // พยายามเชื่อมต่อ MQTT server
  if (client.connect("MQ137Client")) {
    Serial.println(" connected");
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

// ฟังก์ชันสำหรับการตั้งค่า Deep Sleep
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
  
  // ปิดไฟเซนเซอร์ผ่าน Mosfet
  digitalWrite(sensorPowerPin, LOW);
  Serial.println("ปิดไฟเซนเซอร์ผ่าน Mosfet");
  
  delay(3000); // รอให้หน้าจอแสดงข้อความเข้าสู่ deep sleep
  
  // ปิดจอ OLED เพื่อประหยัดพลังงาน
  display.clearDisplay();
  display.display();
  
  // ตั้งค่า ESP32 เข้าสู่โหมด Deep Sleep
  // คำนวณเวลาเป็นไมโครวินาทีด้วย uint64_t เพื่อป้องกัน overflow (เช่น ตั้งค่า > ~35 นาทีแล้วค่าเพี้ยน)
  uint64_t sleep_us = (uint64_t)sleep_time * M_TO_S_FACTOR * uS_TO_S_FACTOR;
  Serial.printf("Deep Sleep: %d min (%llu us)\n", sleep_time, (unsigned long long)sleep_us);
  esp_sleep_enable_timer_wakeup(sleep_us);
  esp_deep_sleep_start();
}

// อ่านค่าอุณหภูมิและความชื้นจาก DHT22
bool readTemperatureAndHumidity(float &temperature, float &humidity) {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("ไม่สามารถอ่านค่าจากเซ็นเซอร์ DHT22 ได้!");
    return false;
  }
  
  // บันทึกค่าล่าสุด
  lastTemperature = temperature;
  lastHumidity = humidity;
  return true;
}

// ฟังก์ชันสำหรับปรับเทียบเซนเซอร์ MQ-137
float calibrateSensor() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Calibrating MQ-137...");
  display.println("Please wait...");
  display.display();
  
  Serial.println("เริ่มการปรับเทียบเซนเซอร์ MQ-137...");
  
  // อ่านค่าอุณหภูมิและความชื้นปัจจุบัน
  float temperature, humidity;
  bool tempReadSuccess = readTemperatureAndHumidity(temperature, humidity);
  
  if (!tempReadSuccess) {
    Serial.println("ใช้ค่าอุณหภูมิและความชื้นค่าเริ่มต้น");
    temperature = REFERENCE_TEMP;
    humidity = REFERENCE_RH;
  }
  
  display.setCursor(0, 20);
  display.print("T: ");
  display.print(temperature, 1);
  display.print("C  H: ");
  display.print(humidity, 1);
  display.println("%");
  display.println("Sampling in clean air...");
  display.display();
  
  // อ่านค่าเฉลี่ยจากเซ็นเซอร์ในอากาศปกติ
  float rs = 0;
  const int numSamples = 10;
  
  for (int i = 0; i < numSamples; i++) {
    float currentRs = getSensorResistance();
    rs += currentRs;
    
    // แสดงค่าตัวอย่าง
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
  
  // ปรับค่า rs ตามอุณหภูมิและความชื้น
  float compensatedRs = compensateRsForTemperatureAndHumidity(rs, temperature, humidity);
  
  // จาก datasheet ค่า Rs ในอากาศปกติมีค่าประมาณ 9-10 เท่าของ Rs ใน 50ppm NH3
  float ro = compensatedRs / 9.8;  // ใช้ค่าประมาณ 9.8 (ตามกราฟความไวใน datasheet)
  
  // แสดงผลค่าที่คำนวณได้
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
  
  // บันทึกค่า Ro ลงใน EEPROM
  Ro = ro;
  saveCalibrationData();
  isCalibrated = true;
  
  display.setCursor(0, 60);
  display.println("Calibration done!");
  display.display();
  
  delay(3000);
  return ro;
}

// ฟังก์ชันอ่านค่าความต้านทานของเซนเซอร์
float getSensorResistance() {
  // อ่านค่า ADC และคำนวณค่าความต้านทานของเซ็นเซอร์
  int adcSum = 0;
  const int numReadings = 10;  // เพิ่มจำนวนการอ่านเพื่อความแม่นยำ
  
  for (int i = 0; i < numReadings; i++) {
    adcSum += analogRead(mq137Pin);
    delay(10);
  }
  
  int adcValue = adcSum / numReadings;
  
  // คำนวณค่า VRL (แรงดันที่ตกคร่อม load resistor)
  float vrl = adcValue * (VOLT_RESOLUTION / ADC_RESOLUTION);
  
  // คำนวณค่า RS (ความต้านทานของเซนเซอร์)
  float rs;
  
  if (vrl < 0.001) {  // ป้องกันการหารด้วยค่าใกล้ศูนย์
    rs = 999.9;  // ค่าสูงมากๆ แทนการหารด้วยศูนย์
  } else {
    rs = ((5.0 * RL) / vrl) - RL;  // ใช้แรงดันจ่ายคงที่ 5V ตามวงจรในเอกสาร
  }
  
  // ป้องกันค่าติดลบ (อาจเกิดขึ้นเมื่อ vrl สูงมาก)
  if (rs < 0) {
    rs = 0.001;
  }
  
  return rs;
}

// ฟังก์ชันสำหรับชดเชยค่า Rs ตามอุณหภูมิและความชื้น (ปรับปรุงตาม datasheet)
float compensateRsForTemperatureAndHumidity(float rs, float temperature, float humidity) {
  // ปรับการชดเชยอุณหภูมิตามกราฟ Typical temperature/humidity characteristics จาก datasheet
  float tempFactor = 1.0;
  
  if (temperature < REFERENCE_TEMP) {
    // อุณหภูมิต่ำกว่าค่าอ้างอิง -> ค่า Rs เพิ่มขึ้นประมาณ 1.5% ต่อ 1°C ที่ต่ำกว่า
    tempFactor = 1.0 + ((REFERENCE_TEMP - temperature) * 0.015);
  } else {
    // อุณหภูมิสูงกว่าค่าอ้างอิง -> ค่า Rs ลดลงประมาณ 1.5% ต่อ 1°C ที่สูงกว่า
    tempFactor = 1.0 - ((temperature - REFERENCE_TEMP) * 0.015);
  }
  
  // ปรับการชดเชยความชื้นตามกราฟ
  float humidityFactor = 1.0;
  
  if (humidity < REFERENCE_RH) {
    // ความชื้นต่ำกว่าค่าอ้างอิง -> ค่า Rs เพิ่มขึ้นประมาณ 0.67% ต่อ 1% RH ที่ต่ำกว่า
    humidityFactor = 1.0 + ((REFERENCE_RH - humidity) * 0.0067);
  } else {
    // ความชื้นสูงกว่าค่าอ้างอิง -> ค่า Rs ลดลงประมาณ 0.4% ต่อ 1% RH ที่สูงกว่า
    humidityFactor = 1.0 - ((humidity - REFERENCE_RH) * 0.004);
  }
  
  // ชดเชยค่า Rs โดยหารด้วยตัวแปรการชดเชย (มากกว่า 1 = ลดค่า, น้อยกว่า 1 = เพิ่มค่า)
  float compensatedRs = rs / (tempFactor * humidityFactor);
  
  // บันทึกข้อมูลลง Serial Monitor เพื่อการตรวจสอบ
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

// ฟังก์ชันคำนวณค่า PPM (ปรับจากกราฟความสัมพันธ์ใน datasheet)
float getPPM(float ratio) {
  // ใช้ฟังก์ชันแบบ power law ตามกราฟ Typical Sensitivity Curve
  // y = a * x^b โดย y = ppm และ x = Rs/Ro
  const float a = 83.17;
  const float b = -1.52;  // ค่าที่ปรับให้เหมาะสมตามกราฟ
  
  // ป้องกันค่าผิดพลาดจากอินพุตที่ไม่คาดคิด
  if (ratio <= 0) {
    return 9999.99;  // ค่าผิดปกติ
  }
  
  return a * pow(ratio, b);
}

// ฟังก์ชันวัดค่าและส่งข้อมูลผ่าน MQTT
void measureAndSendData() {
  // อ่านค่าอุณหภูมิและความชื้นจาก DHT22
  float temperature, humidity;
  bool tempReadSuccess = readTemperatureAndHumidity(temperature, humidity);
  
  if (!tempReadSuccess) {
    temperature = lastTemperature;
    humidity = lastHumidity;
  }
  
  // อ่านค่า analog จากเซนเซอร์ MQ-137
  int adcSum = 0;
  for (int i = 0; i < 10; i++) {  // เพิ่มจำนวนตัวอย่างเพื่อความแม่นยำ
    adcSum += analogRead(mq137Pin);
    delay(10);
  }
  int adcValue = adcSum / 10;
  
  // คำนวณค่า VRL
  float vrl = adcValue * (VOLT_RESOLUTION / ADC_RESOLUTION);
  
  // คำนวณค่า RS
  float rs = ((5.0 * RL) / vrl) - RL;
  
  // ป้องกันค่าติดลบหรือค่าผิดปกติ
  if (rs <= 0) {
    rs = 0.001;
  }
  
  // ชดเชยค่า RS ตามอุณหภูมิและความชื้น
  float compensatedRs = compensateRsForTemperatureAndHumidity(rs, temperature, humidity);
  
  // คำนวณค่า ratio (RS/Ro)
  float ratio = compensatedRs / Ro;
  
  // คำนวณค่าความเข้มข้นของแอมโมเนีย (PPM)
  float ppm = getPPM(ratio);
  
  // แสดงผลค่าทาง Serial Monitor
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
  
  // แสดงผลบนจอ OLED
  display.clearDisplay();
  
  // แสดงค่าอุณหภูมิและความชื้น
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("T: ");
  display.print(temperature, 1);
  display.print("C  H: ");
  display.print(humidity, 1);
  display.println("%");
  
  // แสดงเส้นคั่น
  display.drawLine(0, 10, 128, 10, SH110X_WHITE);
  
  // แสดงค่า Sensor
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
  
  // แสดงค่า NH3 PPM แบบตัวใหญ่
  display.setCursor(0, 46);
  display.print("NH3: ");
  display.setTextSize(2);
  display.setCursor(40, 46);
  display.print(ppm, 1);
  display.setTextSize(1);
  display.setCursor(108, 54);
  display.println("ppm");
  
  display.display();
  delay(5000); // แสดงค่าตัววัดเป็นเวลา 5 วินาที
  
  // ส่งข้อมูลผ่าน MQTT
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("MQTT Status:");
  
  if (!client.connected()) {
    reconnectMQTT();
  }
  
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

// ฟังก์ชันสำหรับตรวจสอบการกดปุ่มคาลิเบรต
void checkCalibrationButton() {
  // ตรวจสอบการกดปุ่มคาลิเบรต
  if (isButtonPressed(calibButtonPin)) {
    delay(50);  // กำจัดการรบกวนจากการกดปุ่ม (debounce)
    
    // ตรวจสอบอีกครั้งเพื่อยืนยันว่าปุ่มถูกกดจริง
    if (isButtonPressed(calibButtonPin)) {
      // แสดงข้อความแจ้งเตือนการคาลิเบรต
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.println("Calibration Mode");
      display.println("Hold button for 3s");
      display.println("to confirm calibration");
      display.display();
      
      Serial.println("ตรวจพบการกดปุ่มคาลิเบรต");
      Serial.println("กดค้างเพื่อยืนยันการคาลิเบรต...");
      
      // รอการกดค้างเพื่อยืนยัน
      unsigned long startTime = millis();
      while (isButtonPressed(calibButtonPin)) {
        // แสดงแถบความคืบหน้า
        int progress = ((millis() - startTime) * 100) / 3000;  // คำนวณเป็นเปอร์เซ็นต์
        progress = constrain(progress, 0, 100);  // จำกัดค่าระหว่าง 0-100
        
        // วาดแถบความคืบหน้า
        display.fillRect(0, 40, 128, 10, SH110X_BLACK);
        display.drawRect(0, 40, 128, 10, SH110X_WHITE);
        display.fillRect(2, 42, (progress * 124) / 100, 6, SH110X_WHITE);
        
        // แสดงเปอร์เซ็นต์
        display.fillRect(0, 52, 128, 8, SH110X_BLACK);
        display.setCursor(56, 52);
        display.print(progress);
        display.print("%");
        display.display();
        
        // ถ้ากดค้างนานพอ ให้เริ่มการคาลิเบรต
        if (millis() - startTime >= 3000) {
          // เริ่มการคาลิเบรต
          calibrationMode = true;
          lastCalibrationTime = millis();
          
          Serial.println("เริ่มโหมดคาลิเบรต");
          display.clearDisplay();
          display.setCursor(0, 0);
          display.println("Starting calibration");
          display.println("Please wait...");
          display.display();
          delay(1000);
          
          // เรียกฟังก์ชันคาลิเบรต
          calibrateSensor();
          
          // ออกจากโหมดคาลิเบรตหลังจากเสร็จสิ้น
          calibrationMode = false;
          break;
        }
        
        delay(50);
      }
      
      // ถ้าปล่อยปุ่มก่อนครบเวลา
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

// ฟังก์ชันอุ่นหัวเซนเซอร์
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
  
  // นับถอยหลังการอุ่นเครื่อง
  for (int i = warmupSeconds; i > 0; i--) {
    display.fillRect(0, 20, 128, 20, SH110X_BLACK);
    display.setCursor(0, 20);
    display.print("Countdown: ");
    display.print(i);
    display.println(" sec");
    
    // แสดงแถบความคืบหน้า
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
