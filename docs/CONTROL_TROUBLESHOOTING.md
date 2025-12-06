# Device Control Troubleshooting Guide 🔧

## ปัญหา: ไม่สามารถปรับเปลี่ยนค่าอุปกรณ์ได้

### ✅ ขั้นตอนการแก้ไข

#### 1. ตรวจสอบ Database Schema

```sql
-- ตรวจสอบว่ามี device_settings record หรือไม่
SELECT d.name, d.id, ds.* 
FROM devices d
LEFT JOIN device_settings ds ON d.id = ds.device_id
ORDER BY d.created_at DESC;
```

**ถ้าไม่มี device_settings record:**
```sql
-- รัน script นี้เพื่อสร้าง default settings
\i scripts/008_ensure_device_settings.sql
```

#### 2. ตรวจสอบ Browser Console

เปิด DevTools (F12) และดูที่ Console tab:

**ข้อความที่ควรเห็น:**
```
Setting threshold: {min: 20, max: 30}
Threshold response: {success: true, action: "setThreshold", ...}
```

**ถ้าเห็น Error:**
- ❌ `401 Unauthorized` → ไม่ได้ Login
- ❌ `404 Not Found` → Device ID ไม่ถูกต้อง
- ❌ `403 Forbidden` → Device ไม่ได้เป็นของ User นี้
- ❌ `400 Bad Request` → Action ไม่ถูกต้องหรือ value ผิดรูปแบบ
- ❌ `500 Internal Server Error` → ดู Server logs

#### 3. ตรวจสอบ API Response

```bash
# Test API ด้วย curl
curl -X POST http://localhost:3000/api/devices/YOUR_DEVICE_ID/control \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "action": "setThreshold",
    "value": {"min": 20, "max": 30}
  }'
```

**Response ที่ถูกต้อง:**
```json
{
  "success": true,
  "action": "setThreshold",
  "deviceId": "...",
  "threshold": {"min": 20, "max": 30},
  "message": "ตั้งค่า Threshold สำเร็จ"
}
```

#### 4. ตรวจสอบ Row Level Security (RLS)

```sql
-- ตรวจสอบ RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'device_settings';

-- ทดสอบการ query ด้วย user_id
SELECT * FROM device_settings 
WHERE device_id IN (
  SELECT id FROM devices WHERE user_id = 'YOUR_USER_ID'
);
```

#### 5. ตรวจสอบ Server Logs

ดูที่ Terminal ที่รัน `npm run dev`:

**Log ที่ควรเห็น:**
```
POST /api/devices/[id]/control 200 in 123ms
```

**ถ้าเห็น Error:**
```
Control API Error: ...
```
→ ดู error message ใน log

---

## 🐛 Common Issues

### Issue 1: "Unknown action" Error

**สาเหตุ:** ชื่อ action ไม่ตรงกับที่ API รองรับ

**วิธีแก้:**
```typescript
// Actions ที่รองรับ:
- "power"           // เปิด/ปิดอุปกรณ์
- "setThreshold"    // ตั้งค่า min/max threshold
- "setAlertEnabled" // เปิด/ปิดการแจ้งเตือน
- "setSamplingRate" // ตั้งค่า update interval
- "mode"            // เปลี่ยนโหมด
```

### Issue 2: Upsert Conflict Error

**สาเหตุ:** device_settings มีหลาย record สำหรับ device_id เดียวกัน

**วิธีแก้:**
```sql
-- ลบ duplicate records
DELETE FROM device_settings ds1
WHERE EXISTS (
  SELECT 1 FROM device_settings ds2
  WHERE ds1.device_id = ds2.device_id
  AND ds1.id > ds2.id
);
```

### Issue 3: "Cannot read property of null"

**สาเหตุ:** ไม่มี device_settings record

**วิธีแก้:**
```sql
-- สร้าง default settings
INSERT INTO device_settings (device_id, min_threshold, max_threshold, alert_enabled, update_interval)
VALUES ('YOUR_DEVICE_ID', 20.0, 30.0, true, 60)
ON CONFLICT (device_id) DO NOTHING;
```

### Issue 4: Changes not reflected

**สาเหตุ:** Cache หรือไม่ได้ refresh data

**วิธีแก้:**
1. Hard refresh browser: `Ctrl + Shift + R`
2. ตรวจสอบ `mutateSettings()` ถูกเรียกหลัง API success
3. ตรวจสอบว่า useEffect load data ใหม่เมื่อ settings เปลี่ยน

---

## 📋 Debug Checklist

เมื่อพบปัญหา ให้ทำตามลำดับ:

- [ ] 1. เปิด Browser Console (F12)
- [ ] 2. Refresh หน้า Control
- [ ] 3. กดปุ่ม "บันทึกการตั้งค่า"
- [ ] 4. ดู Console logs:
  - [ ] "Saving all settings: {...}"
  - [ ] "Threshold response: {...}"
  - [ ] "Alert response: {...}"
  - [ ] "Sampling response: {...}"
- [ ] 5. ตรวจสอบทุก response มี `success: true`
- [ ] 6. ถ้ามี error ดู `error` หรือ `details` field
- [ ] 7. ตรวจสอบ Database ว่ามีการเปลี่ยนแปลง:
  ```sql
  SELECT * FROM device_settings 
  WHERE device_id = 'YOUR_DEVICE_ID'
  ORDER BY updated_at DESC;
  ```

---

## 🚀 Quick Fix Commands

```bash
# 1. Restart dev server
npm run dev

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps

# 4. Check database connection
# (ใน Supabase Dashboard → SQL Editor)
SELECT current_user, current_database();
```

---

## 📞 Still Not Working?

ถ้าทำตาม troubleshooting แล้วยังไม่ได้:

1. **Export Logs:**
   - บันทึก Browser Console output
   - บันทึก Terminal output (server logs)
   - Screenshot ของ error message

2. **ตรวจสอบ Database State:**
   ```sql
   -- Export device info
   SELECT 
     d.id,
     d.name,
     d.user_id,
     ds.min_threshold,
     ds.max_threshold,
     ds.alert_enabled,
     ds.update_interval,
     ds.updated_at
   FROM devices d
   LEFT JOIN device_settings ds ON d.id = ds.device_id
   WHERE d.id = 'YOUR_DEVICE_ID';
   ```

3. **Test API Directly:**
   - ใช้ Postman หรือ curl
   - Test แต่ละ action แยกกัน
   - ส่ง logs มาให้ดู

---

## ✅ Expected Behavior

เมื่อทำงานถูกต้อง:

1. กด "บันทึกการตั้งค่า" → แสดง "กำลังบันทึก..."
2. Console แสดง 3-4 API calls พร้อม responses
3. Toast notification: "บันทึกการตั้งค่าทั้งหมดเรียบร้อย" (สีเขียว)
4. Values ในฟอร์มยังคงเหมือนเดิม (ไม่ reset)
5. Database มีการ update `updated_at` timestamp
6. Refresh หน้า → เห็นค่าใหม่ที่บันทึกไว้

---

**Created:** December 7, 2025  
**Last Updated:** December 7, 2025
