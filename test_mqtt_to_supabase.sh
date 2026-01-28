#!/bin/bash
# test_mqtt_to_supabase.sh
# สคริปต์ทดสอบ MQTT → CSV → Supabase pipeline

echo "🧪 Testing MQTT to Supabase Pipeline"
echo "====================================="
echo ""

# Test 1: ส่งข้อมูลทดสอบผ่าน MQTT
echo "📤 Step 1: Publishing test data to MQTT..."
mosquitto_pub -h 192.168.1.142 -p 1883 \
  -t "iot/Station_1/ammonia" \
  -m '{"id":"Station_1","ammonia":15.3,"temperature":28.5,"humidity":65.2,"calibratedRo":9.8,"timestamp":"10:30:45"}'

echo "✅ Test message sent"
echo ""

# Test 2: รอให้ระบบประมวลผล
echo "⏳ Step 2: Waiting for system to process..."
sleep 3
echo ""

# Test 3: ตรวจสอบ CSV
echo "📄 Step 3: Checking CSV file..."
if [ -f "sensor_data.csv" ]; then
    echo "✅ CSV file exists"
    echo "Last 3 lines:"
    tail -n 3 sensor_data.csv
else
    echo "❌ CSV file not found"
fi
echo ""

# Test 4: แสดงคำแนะนำตรวจสอบ Supabase
echo "☁️  Step 4: Check Supabase manually"
echo "   1. Go to: https://gninseyojtjnfonoerve.supabase.co"
echo "   2. Open Table Editor → sensor_data"
echo "   3. Check for new row with value ~15.3 ppm"
echo ""

echo "✅ Test completed!"
echo "If you see data in CSV and Supabase, the pipeline works! 🎉"
