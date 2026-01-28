#!/bin/bash
# check_data_logger.sh - ตรวจสอบสถานะ data logger

echo "🔍 Checking Data Logger Status..."
echo "----------------------------------------"

# ตรวจสอบ process
PID=$(pgrep -f "data_logger_updated.py")

if [ -z "$PID" ]; then
    echo "❌ Data logger is NOT running"
else
    echo "✅ Data logger is running (PID: $PID)"
    
    # แสดงข้อมูล process
    echo ""
    echo "📊 Process Info:"
    ps aux | grep "data_logger_updated.py" | grep -v grep
fi

echo ""
echo "----------------------------------------"

# ตรวจสอบ MQTT broker
echo "🔌 MQTT Broker Status:"
if systemctl is-active --quiet mosquitto; then
    echo "✅ Mosquitto is running"
    echo "   Port 1883: $(sudo netstat -tlnp | grep :1883 | wc -l) connection(s)"
else
    echo "❌ Mosquitto is not running"
    echo "   💡 Start with: sudo systemctl start mosquitto"
fi

echo ""
echo "----------------------------------------"

# แสดง log ล่าสุด (ถ้ามี)
if [ -f "sensor_data.csv" ]; then
    echo "📝 Latest Data (last 3 lines):"
    tail -n 3 sensor_data.csv
else
    echo "ℹ️  No sensor data file found yet"
fi
