# ESP32 ADC Issue - Quick Fix

## ✅ ข้อมูลเข้า Supabase แล้ว
```json
{
  "value": 0,
  "temperature": 30.7,
  "humidity": 65.8,
  "timestamp": "2026-01-21 03:35:15.908741+00"
}
```

แต่ `value = 0` ❌ → ADC ไม่อ่านค่า

---

## 🔧 ขั้นตอนแก้ไข

### Step 1: Test ADC Pin

Upload `ESP32_ADC_TEST.ino` จาก `/docs/`

ตรวจสอบ Serial Monitor:

```
--- Reading 10 samples ---
Sample 1: 2048 (1.654 V)  ✅ ดี
Sample 2: 2045 (1.652 V)
...
```

ถ้า **ทุกค่าเป็น 0** → ปัญหา GPIO 34

---

## 🔌 GPIO Alternatives

หาก GPIO34 ไม่ทำงาน ลอง GPIO อื่น:

```c
#define SENSOR_PIN 35   // ADC1_CH7
// หรือ
#define SENSOR_PIN 32   // ADC1_CH4
// หรือ  
#define SENSOR_PIN 33   // ADC1_CH5
```

แล้ว upload `ESP32_ADC_TEST.ino` ใหม่

---

## ✅ เมื่อ ADC ทำงาน

ค่า ADC > 0 แต่ ammonia ยังน้อย?

### Check Sensor Calibration:

```
ค่า Ro ที่ calibrate = 80.6460 kOhm  ← ตัวเลขนี้!
```

MQ-137 ต้อง calibrate ใน **clean air**:
- ห่างจากแหล่งแอมโมเนีย (อย่างน้อย 2 เมตร)
- ให้เวลาอุ่นเครื่อง **5-10 นาที**
- อื่น ๆ clean air ก่อน calibrate

### ปรับ calibration โค้ด:

```cpp
#define MQ137_RO_DEFAULT 80.64  // ← ใช้ค่าที่ได้จาก calibration

// หรือ re-calibrate
void calibrate_MQ137() {
  // ทำให้ sensor อุ่นเครื่อง 5 นาที
  delay(300000);  // 5 minutes
  
  // ...rest of calibration code...
}
```

---

## 🎯 Sensor Response

เมื่อใกล้แหล่งแอมโมเนีย ค่า ammonia ควรเพิ่มขึ้น

### Test ด้วย Ammonia Source:

```
Normal air:     0-5 ppm
พื้นที่เลี้ยงสัตว์: 10-30 ppm
Concentrated:   50+ ppm
```

---

## 📊 Dashboard Check

เปิด `/admin/workflow` ดู:

```
Messages Today: X (ควรเพิ่มขึ้น)
Recent Messages: ดู ammonia values
```

Refresh หน้า และ upload ใหม่ หลังแก้ไข GPIO

---

## 🆘 Still Not Working?

ถ้าทำตามแล้ว ADC ยังเป็น 0:

1. **Multimeter test**: วัด voltage ที่ Sensor A0 (ควร 0-3.3V)
2. **Visual inspection**: ตรวจสอบ wire connections
3. **Try GPIO35**: ลอง alternative pin
4. **Check 3.3V**: ตรวจสอบ power supply voltage

---

## Next: Temperature Sensor

DHT22 ไม่ทำงาน? ไม่เป็นไร - ใช้ค่า default ก่อน

ต่อมาจะ add:
- NTP time sync
- DHT22 library support
- Battery monitoring

**Main priority**: Fix ADC → Get ammonia readings ✅
