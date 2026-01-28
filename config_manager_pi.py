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
    """ดึงรายชื่อ device ทั้งหมด"""
    config = load_config()
    devices = config.get('devices', {})
    return jsonify({
        "status": "success",
        "devices": devices
    })

@app.route('/api/config/device/<device_id>', methods=['GET'])
def get_device(device_id):
    """ดึง config ของ device เดียว"""
    config = load_config()
    device = config.get('devices', {}).get(device_id)
    
    if not device:
        return jsonify({
            "status": "error",
            "message": f"Device '{device_id}' not found"
        }), 404
    
    return jsonify({
        "status": "success",
        "device": device
    })

@app.route('/api/config/device/<device_id>', methods=['POST'])
def update_device(device_id):
    """อัปเดต config ของ device"""
    data = request.get_json()
    config = load_config()
    
    if device_id not in config.get('devices', {}):
        # สร้าง device ใหม่ถ้ายังไม่มี
        if 'devices' not in config:
            config['devices'] = {}
    
    # อัปเดต device config
    device_config = config.get('devices', {}).get(device_id, {})
    device_config.update(data)
    device_config['last_updated'] = datetime.now().isoformat()
    
    config['devices'][device_id] = device_config
    
    if save_config(config):
        return jsonify({
            "status": "success",
            "message": f"Device '{device_id}' updated",
            "device": device_config
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
    
    if device_id not in config.get('devices', {}):
        return jsonify({
            "status": "error",
            "message": f"Device '{device_id}' not found"
        }), 404
    
    del config['devices'][device_id]
    
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

@app.route('/api/config/mqtt', methods=['GET'])
def get_mqtt_config():
    """ดึง MQTT broker config"""
    config = load_config()
    mqtt_config = config.get('mqtt', {})
    return jsonify({
        "status": "success",
        "mqtt": mqtt_config
    })

@app.route('/api/config/mqtt', methods=['POST'])
def update_mqtt_config():
    """อัปเดต MQTT broker config"""
    data = request.get_json()
    config = load_config()
    
    config['mqtt'].update(data)
    
    if save_config(config):
        return jsonify({
            "status": "success",
            "message": "MQTT config updated",
            "mqtt": config['mqtt']
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to save config"
        }), 500

@app.route('/api/config/reset', methods=['POST'])
def reset_config():
    """รีเซ็ต config กลับไปค่า default"""
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
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "service": "IoT Config Manager",
        "config_file": CONFIG_FILE,
        "timestamp": datetime.now().isoformat()
    })

# =============================================
# Main
# =============================================

if __name__ == '__main__':
    # เริ่มต้นด้วย default config ถ้าไฟล์ไม่มี
    if not os.path.exists(CONFIG_FILE):
        print("📝 Creating default config...")
        save_config(DEFAULT_CONFIG)
    
    print(f"🚀 IoT Config Manager Starting...")
    print(f"📁 Config file: {CONFIG_FILE}")
    print(f"🔗 API Endpoint: http://localhost:5000/api/config")
    print(f"💡 Health check: http://localhost:5000/health")
    print("-" * 50)
    
    # เปิด Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)
