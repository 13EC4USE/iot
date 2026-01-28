#!/bin/bash
# Copy-paste คำสั่งนี้ทั้งหมดบน Raspberry Pi Terminal
# จะสร้างไฟล์ทั้งหมดที่จำเป็นอัตโนมัติ

echo "🚀 Creating IoT system files..."

# สร้าง directory
mkdir -p /home/admin/io-t-webpage
cd /home/admin/io-t-webpage

# ===== 1. iot_config.json =====
cat << 'EOF' > iot_config.json
{
  "devices": {
    "Station_1": {
      "device_id": "Station_1",
      "broker": "192.168.1.142",
      "port": 1883,
      "topic_prefix": "iot/",
      "enabled": true,
      "uuid": "46588dc3-c4d1-4269-b626-90116c8b97a4",
      "last_updated": "2025-01-20T00:00:00"
    }
  },
  "mqtt": {
    "broker": "192.168.1.142",
    "port": 1883,
    "use_auth": false,
    "username": "",
    "password": ""
  },
  "local_logging": {
    "csv_file": "sensor_data.csv",
    "enable_csv": true,
    "enable_supabase": true
  }
}
EOF

echo "✅ Created iot_config.json"

# ===== 2. data_logger_updated.py =====
cat << 'EOF' > data_logger_updated.py
# data_logger.py - อัปเดตสำหรับ topic ใหม่ iot/#

import paho.mqtt.client as mqtt
import json
import time
import csv
import os
from datetime import datetime
import threading
from supabase import create_client, Client

# ==================================================
# ⚙️ ส่วนตั้งค่า (จาก config file)
# ==================================================
SUPABASE_URL = "https://gninseyojtjnfonoerve.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaW5zZXlvanRqbmZvbm9lcnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTU0MDksImV4cCI6MjA4MDIzMTQwOX0.cFEVSzD71rnBKdd6azv2YM898n3TUBclEXKLqEGdb2A"

# ไฟล์ config
CONFIG_FILE = "iot_config.json"

# ตัวแปร global ที่อ่านจาก config
DEVICE_MAP = {}
MQTT_BROKER = "192.168.1.142"
MQTT_PORT = 1883
LOCAL_TOPIC = "iot/#"
LOG_FILE = "sensor_data.csv"

def load_config():
    """อ่าน config จากไฟล์ JSON"""
    global DEVICE_MAP, MQTT_BROKER, MQTT_PORT, LOCAL_TOPIC, LOG_FILE
    
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # นำ device mapping มาจาก config
            devices = config.get('devices', {})
            DEVICE_MAP = {dev_id: dev['uuid'] for dev_id, dev in devices.items()}
            
            # นำ MQTT settings
            mqtt_cfg = config.get('mqtt', {})
            MQTT_BROKER = mqtt_cfg.get('broker', '192.168.1.142')
            MQTT_PORT = mqtt_cfg.get('port', 1883)
            
            # Local logging
            local_cfg = config.get('local_logging', {})
            LOG_FILE = local_cfg.get('csv_file', 'sensor_data.csv')
            
            print(f"✅ Config loaded from {CONFIG_FILE}")
            print(f"   Broker: {MQTT_BROKER}:{MQTT_PORT}")
            print(f"   Devices: {list(DEVICE_MAP.keys())}")
            return True
        else:
            print(f"⚠️  Config file not found: {CONFIG_FILE}")
            print(f"   Using default values")
            DEVICE_MAP = {"Station_1": "46588dc3-c4d1-4269-b626-90116c8b97a4"}
            return False
    except Exception as e:
        print(f"❌ Failed to load config: {e}")
        return False

# ==================================================

# เริ่มการเชื่อมต่อ Supabase
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase Client Ready")
except Exception as e:
    print(f"❌ Supabase Setup Failed: {e}")
    supabase = None

# ฟังก์ชันส่งขึ้น Supabase
def save_to_supabase(data_dict):
    def job():
        if supabase is None: 
            return
        try:
            device_name = data_dict.get('id', 'Unknown')
            real_uuid = DEVICE_MAP.get(device_name)

            if real_uuid is None:
                print(f"⚠️  Skip Upload: ไม่พบ UUID ของ '{device_name}'")
                print(f"   💡 เพิ่มใน DEVICE_MAP ถ้าต้องการบันทึกลง Supabase")
                return

            payload = {
                "device_id": real_uuid,
                "value": data_dict.get('ammonia', 0.0),
                "unit": "ppm",
                "temperature": data_dict.get('temperature', 0.0),
                "humidity": data_dict.get('humidity', 0.0),
                "timestamp": datetime.now().isoformat()
            }
            
            supabase.table("sensor_data").insert(payload).execute()
            print(f"☁️  Uploaded to Supabase: {device_name} -> {payload['value']} ppm")
            
        except Exception as e:
            print(f"⚠️  Supabase Upload Failed: {e}")
            
    thread = threading.Thread(target=job)
    thread.start()

# ฟังก์ชันบันทึก CSV
def save_to_csv(data_dict):
    file_exists = os.path.isfile(LOG_FILE)
    try:
        with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow([
                    "Timestamp", "Device_ID", "Ammonia_PPM", 
                    "Temperature", "Humidity", "Ro_Value"
                ])
            
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow([
                current_time, 
                data_dict.get('id', 'Unknown'), 
                data_dict.get('ammonia', 0.0), 
                data_dict.get('temperature', 0.0), 
                data_dict.get('humidity', 0.0), 
                data_dict.get('calibratedRo', 0.0)
            ])
            print(f"💾 Saved CSV: {data_dict.get('id')} -> {data_dict.get('ammonia')} ppm")
    except Exception as e:
        print(f"❌ CSV Error: {e}")

# ฟังก์ชันหลัก - รับข้อความจาก MQTT
def on_message(client, userdata, msg):
    try:
        topic_str = msg.topic
        payload_str = msg.payload.decode()
        payload = json.loads(payload_str)
        
        device_id = payload.get('id', 'Unknown')
        ammonia = payload.get('ammonia', 0.0)
        
        print(f"\n📥 Received from topic: {topic_str}")
        print(f"   Device: {device_id} | NH3: {ammonia} ppm")
        
        # ทำงาน 2 อย่าง
        save_to_csv(payload)
        save_to_supabase(payload)

    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error: {e}")
        print(f"   Raw payload: {msg.payload}")
    except Exception as e:
        print(f"❌ Error processing message: {e}")

# เริ่มระบบ
print("🚀 Starting MQTT Data Logger...")

# โหลด config ก่อน
load_config()

print(f"📡 Broker: {MQTT_BROKER}:{MQTT_PORT}")
print(f"📌 Topic: {LOCAL_TOPIC}")
print(f"📊 Devices mapped: {list(DEVICE_MAP.keys())}")
print("-" * 50)

client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.subscribe(LOCAL_TOPIC)
client.on_message = on_message
client.loop_start()

print(f"✅ System Running! Waiting for data...\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n\n🛑 Stopping system...")
    client.loop_stop()
    print("👋 Goodbye!")
EOF

echo "✅ Created data_logger_updated.py"

# ===== 3. config_manager_pi.py =====
cat << 'EOF' > config_manager_pi.py
#!/usr/bin/env python3
# config_manager_pi.py
# Config management service สำหรับ Pi + ESP32
# Run this on Raspberry Pi to manage device configuration

import json
import os
import threading
from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# ไฟล์เก็บ config
CONFIG_FILE = "iot_config.json"
LOCK = threading.Lock()

# Default config ตอนแรก
DEFAULT_CONFIG = {
    "devices": {
        "Station_1": {
            "device_id": "Station_1",
            "broker": "192.168.1.142",
            "port": 1883,
            "topic_prefix": "iot/",
            "enabled": True,
            "uuid": "46588dc3-c4d1-4269-b626-90116c8b97a4",
            "last_updated": datetime.now().isoformat()
        }
    },
    "mqtt": {
        "broker": "192.168.1.142",
        "port": 1883,
        "use_auth": False,
        "username": "",
        "password": ""
    },
    "local_logging": {
        "csv_file": "sensor_data.csv",
        "enable_csv": True,
        "enable_supabase": True
    }
}

def load_config():
    """โหลด config จากไฟล์"""
    with LOCK:
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"❌ Failed to load config: {e}")
                return DEFAULT_CONFIG
        return DEFAULT_CONFIG

def save_config(config):
    """บันทึก config ลงไฟล์"""
    with LOCK:
        try:
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            print(f"✅ Config saved: {CONFIG_FILE}")
            return True
        except Exception as e:
            print(f"❌ Failed to save config: {e}")
            return False

# =============================================
# API Endpoints
# =============================================

@app.route('/api/config', methods=['GET'])
def get_config():
    """ดึง config ทั้งหมด"""
    config = load_config()
    return jsonify({
        "status": "success",
        "data": config,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config/devices', methods=['GET'])
def get_devices():
    """ดึงรายการ devices ทั้งหมด"""
    config = load_config()
    return jsonify({
        "status": "success",
        "data": config.get("devices", {}),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config/device/<device_id>', methods=['GET'])
def get_device(device_id):
    """ดึงข้อมูล device เดียว"""
    config = load_config()
    device = config.get("devices", {}).get(device_id)
    
    if device:
        return jsonify({
            "status": "success",
            "data": device,
            "timestamp": datetime.now().isoformat()
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Device '{device_id}' not found"
        }), 404

@app.route('/api/config/device/<device_id>', methods=['POST'])
def update_device(device_id):
    """อัปเดต/เพิ่ม device"""
    config = load_config()
    data = request.get_json()
    
    if "devices" not in config:
        config["devices"] = {}
    
    # อัปเดตข้อมูล device
    config["devices"][device_id] = {
        "device_id": device_id,
        "broker": data.get("broker", "192.168.1.142"),
        "port": data.get("port", 1883),
        "topic_prefix": data.get("topic_prefix", "iot/"),
        "enabled": data.get("enabled", True),
        "uuid": data.get("uuid", ""),
        "last_updated": datetime.now().isoformat()
    }
    
    if save_config(config):
        return jsonify({
            "status": "success",
            "message": f"Device '{device_id}' updated",
            "data": config["devices"][device_id]
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to save config"
        }), 500

@app.route('/api/config/device/<device_id>', methods=['DELETE'])
def delete_device(device_id):
    """ลบ device"""
    config = load_config()
    
    if device_id in config.get("devices", {}):
        del config["devices"][device_id]
        if save_config(config):
            return jsonify({
                "status": "success",
                "message": f"Device '{device_id}' deleted"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to save config"
            }), 500
    else:
        return jsonify({
            "status": "error",
            "message": f"Device '{device_id}' not found"
        }), 404

@app.route('/api/config/mqtt', methods=['GET'])
def get_mqtt_config():
    """ดึง MQTT config"""
    config = load_config()
    return jsonify({
        "status": "success",
        "data": config.get("mqtt", {}),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config/mqtt', methods=['POST'])
def update_mqtt_config():
    """อัปเดต MQTT config"""
    config = load_config()
    data = request.get_json()
    
    config["mqtt"] = {
        "broker": data.get("broker", "192.168.1.142"),
        "port": data.get("port", 1883),
        "use_auth": data.get("use_auth", False),
        "username": data.get("username", ""),
        "password": data.get("password", "")
    }
    
    if save_config(config):
        return jsonify({
            "status": "success",
            "message": "MQTT config updated",
            "data": config["mqtt"]
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to save config"
        }), 500

@app.route('/api/config/reset', methods=['POST'])
def reset_config():
    """รีเซ็ต config เป็นค่าเริ่มต้น"""
    if save_config(DEFAULT_CONFIG):
        return jsonify({
            "status": "success",
            "message": "Config reset to default",
            "data": DEFAULT_CONFIG
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to reset config"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "IoT Config Manager",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting IoT Config Manager API...")
    print(f"📁 Config file: {CONFIG_FILE}")
    print(f"🌐 API: http://0.0.0.0:5000")
    print("-" * 50)
    
    # สร้างไฟล์ config ถ้ายังไม่มี
    if not os.path.exists(CONFIG_FILE):
        print(f"Creating default config file: {CONFIG_FILE}")
        save_config(DEFAULT_CONFIG)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

echo "✅ Created config_manager_pi.py"

# ===== 4. test_mqtt_to_supabase.sh =====
cat << 'EOF' > test_mqtt_to_supabase.sh
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
EOF

chmod +x test_mqtt_to_supabase.sh
echo "✅ Created test_mqtt_to_supabase.sh"

# ===== 5. setup_pi.sh =====
cat << 'EOF' > setup_pi.sh
#!/bin/bash
# setup_pi.sh - ติดตั้งและ setup ระบบบน Raspberry Pi

echo "🚀 Setting up IoT system on Raspberry Pi..."
echo "==========================================="
echo ""

# 1. ติดตั้ง Python dependencies
echo "📦 Step 1: Installing Python dependencies..."
pip3 install paho-mqtt supabase-py flask --break-system-packages 2>/dev/null || pip3 install paho-mqtt supabase-py flask
echo ""

# 2. สร้าง systemd service สำหรับ Config Manager
echo "⚙️  Step 2: Creating Config Manager service..."
sudo tee /etc/systemd/system/iot-config-manager.service > /dev/null <<EOFSERVICE
[Unit]
Description=IoT Config Manager API
After=network.target

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/io-t-webpage
ExecStart=/usr/bin/python3 /home/admin/io-t-webpage/config_manager_pi.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOFSERVICE
echo "✅ Config Manager service created"
echo ""

# 3. สร้าง systemd service สำหรับ Data Logger
echo "⚙️  Step 3: Creating Data Logger service..."
sudo tee /etc/systemd/system/iot-data-logger.service > /dev/null <<EOFSERVICE
[Unit]
Description=IoT Data Logger (MQTT to Supabase)
After=network.target mosquitto.service
Requires=mosquitto.service

[Service]
Type=simple
User=admin
WorkingDirectory=/home/admin/io-t-webpage
ExecStart=/usr/bin/python3 /home/admin/io-t-webpage/data_logger_updated.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOFSERVICE
echo "✅ Data Logger service created"
echo ""

# 4. Enable และ start services
echo "🔄 Step 4: Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable iot-config-manager
sudo systemctl enable iot-data-logger
sudo systemctl start iot-config-manager
sudo systemctl start iot-data-logger
echo ""

# 5. ตรวจสอบสถานะ
echo "🔍 Step 5: Checking service status..."
echo ""
echo "--- Config Manager Status ---"
sudo systemctl status iot-config-manager --no-pager | head -10
echo ""
echo "--- Data Logger Status ---"
sudo systemctl status iot-data-logger --no-pager | head -10
echo ""
echo "--- Mosquitto Status ---"
sudo systemctl status mosquitto --no-pager | head -10
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📡 Config API: http://192.168.1.142:5000"
echo "📊 MQTT Broker: 192.168.1.142:1883"
echo ""
echo "🧪 Run './test_mqtt_to_supabase.sh' to test the system"
EOF

chmod +x setup_pi.sh
echo "✅ Created setup_pi.sh"

echo ""
echo "🎉 All files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./setup_pi.sh"
echo "2. Test: ./test_mqtt_to_supabase.sh"
echo "3. Check logs: journalctl -u iot-data-logger -f"
echo ""
