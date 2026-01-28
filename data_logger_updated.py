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
MQTT_BROKER = "192.168.1.104"  # Pi IP
MQTT_PORT = 1883
LOCAL_TOPIC = "sensors/#"  # Changed to receive from ESP32 sensors/ammonia topic
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
            device_name = data_dict.get('id', 'Station_1')  # ตรวจสอบว่า ESP ส่ง 'id' มาหรือไม่
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
        
        # ESP32 ส่งมาที่ sensors/ammonia โดยไม่มี id field
        # ใช้ Station_1 เป็นค่าเริ่มต้นสำหรับ sensors/ammonia topic
        if 'sensors/ammonia' in topic_str:
            device_id = 'Station_1'
            # เพิ่ม id field ให้กับ payload เพื่อให้ระบบทำงานได้ต่อ
            payload['id'] = device_id
        else:
            device_id = payload.get('id', 'Station_1')
        
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
