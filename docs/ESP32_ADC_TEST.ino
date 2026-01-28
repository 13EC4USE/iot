/*
 * ESP32 ADC Test - เพื่อตรวจสอบว่า Sensor ถูก connect หรือไม่
 * Upload นี้ก่อน เพื่อหาปัญหา GPIO
 */

#define SENSOR_PIN 34        // ลอง GPIO34 ก่อน

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n=== ESP32 ADC DIAGNOSTIC ===\n");
  
  // ตั้งค่า ADC resolution
  analogSetWidth(12);        // 12-bit = 0-4095
  analogSetAttenuation(ADC_11db);  // Full scale: 3.6V (safer for 3.3V)
  
  Serial.println("Testing GPIO34 (ADC1_CH6)...\n");
  Serial.println("Expected connections:");
  Serial.println("  - Sensor A0 → GPIO34");
  Serial.println("  - Sensor VCC → 3.3V");
  Serial.println("  - Sensor GND → GND\n");
  
  pinMode(SENSOR_PIN, INPUT);
}

void loop() {
  // อ่านค่า ADC 10 ครั้ง
  Serial.println("--- Reading 10 samples ---");
  float sum = 0;
  int min_val = 4095;
  int max_val = 0;
  
  for (int i = 0; i < 10; i++) {
    int raw = analogRead(SENSOR_PIN);
    sum += raw;
    if (raw < min_val) min_val = raw;
    if (raw > max_val) max_val = raw;
    
    float voltage = raw * (3.3 / 4095.0);
    
    Serial.print("Sample ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print(raw);
    Serial.print(" (");
    Serial.print(voltage, 3);
    Serial.println(" V)");
    
    delay(100);
  }
  
  float avg = sum / 10.0;
  Serial.println("\n📊 Statistics:");
  Serial.print("  Min: ");
  Serial.println(min_val);
  Serial.print("  Max: ");
  Serial.println(max_val);
  Serial.print("  Avg: ");
  Serial.println(avg);
  
  // Diagnosis
  Serial.println("\n🔍 Diagnosis:");
  
  if (avg == 0) {
    Serial.println("  ❌ ADC = 0!");
    Serial.println("  Possible causes:");
    Serial.println("    1. Sensor not connected");
    Serial.println("    2. Wrong GPIO pin (34 is ADC1_CH6)");
    Serial.println("    3. Sensor not powered (check 3.3V)");
    Serial.println("    4. GPIO34 is damaged\n");
    Serial.println("  Try other ADC pins:");
    Serial.println("    - GPIO35 (ADC1_CH7)");
    Serial.println("    - GPIO32 (ADC1_CH4)");
    Serial.println("    - GPIO33 (ADC1_CH5)");
  } 
  else if (avg < 100) {
    Serial.println("  ⚠️  Low ADC value");
    Serial.println("     Sensor may not be connected properly");
  }
  else if (avg > 4000) {
    Serial.println("  ⚠️  ADC close to max (3.3V)");
    Serial.println("     Sensor may be disconnected or shorted");
  }
  else {
    Serial.println("  ✅ ADC reading looks good!");
    Serial.println("     Continue with main code");
  }
  
  Serial.println("\n" + String(30) + " sec until next read...\n");
  delay(30000);  // อ่านทุก 30 วินาที
}

/*
 * GPIO ADC Map (ESP32):
 * ADC1:
 *   - GPIO36 (ADC1_CH0) - also INPUT_ONLY
 *   - GPIO37 (ADC1_CH1) - also INPUT_ONLY
 *   - GPIO38 (ADC1_CH2) - also INPUT_ONLY
 *   - GPIO39 (ADC1_CH3) - also INPUT_ONLY
 *   - GPIO32 (ADC1_CH4)
 *   - GPIO33 (ADC1_CH5)
 *   - GPIO34 (ADC1_CH6) - ← Current test
 *   - GPIO35 (ADC1_CH7)
 * 
 * ADC2 (not recommended for WiFi projects)
 * 
 * SENSOR WIRING TIPS:
 * 1. Use short wires (< 10cm) to reduce noise
 * 2. Add 0.1µF capacitor near sensor A0 to GND
 * 3. Use external 10kΩ pull-down resistor if needed
 * 4. Ensure proper 3.3V power supply
 */
