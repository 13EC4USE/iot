#!/bin/bash
# start_data_logger.sh - รัน data logger บน Pi

echo "🚀 Starting Data Logger..."
echo "----------------------------------------"

# ตรวจสอบว่า Python script มีอยู่หรือไม่
if [ ! -f "data_logger_updated.py" ]; then
    echo "❌ Error: data_logger_updated.py not found!"
    exit 1
fi

# ตรวจสอบว่า config file มีอยู่หรือไม่
if [ ! -f "iot_config.json" ]; then
    echo "❌ Error: iot_config.json not found!"
    exit 1
fi

# แสดง config
echo "📋 Configuration:"
echo "   MQTT Broker: $(grep -A 2 '"mqtt"' iot_config.json | grep broker | cut -d'"' -f4)"
echo "   Devices: $(grep -o '"device_id"[^,]*' iot_config.json | cut -d'"' -f4 | tr '\n' ' ')"
echo ""

# รัน data logger
echo "✅ Starting data logger..."
python3 data_logger_updated.py

# ถ้า script หยุดทำงาน
echo ""
echo "⚠️  Data logger stopped"
