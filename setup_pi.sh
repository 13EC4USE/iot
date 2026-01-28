# คำสั่งสำหรับติดตั้งและรันระบบบน Raspberry Pi
# Run these commands on Raspberry Pi

# 1. ไปที่ directory
cd /home/pi

# 2. Clone โปรเจกต์ (ถ้ายังไม่มี) หรือ copy ไฟล์จาก Windows
# Option A: ใช้ Git
# git clone <your-repo-url> io-t-webpage

# Option B: ใช้ SCP copy จาก Windows
# scp -r "d:\io-t-webpage (2)"/* pi@192.168.1.142:/home/pi/io-t-webpage/

# 3. ติดตั้ง Python dependencies
cd /home/pi/io-t-webpage
pip3 install paho-mqtt supabase-py flask

# 4. ให้สิทธิ์ execute shell script
chmod +x test_mqtt_to_supabase.sh

# 5. สร้าง systemd service สำหรับ auto-start

# สร้างไฟล์ service สำหรับ Config Manager
sudo tee /etc/systemd/system/iot-config-manager.service > /dev/null <<EOF
[Unit]
Description=IoT Config Manager API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/io-t-webpage
ExecStart=/usr/bin/python3 /home/pi/io-t-webpage/config_manager_pi.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# สร้างไฟล์ service สำหรับ Data Logger
sudo tee /etc/systemd/system/iot-data-logger.service > /dev/null <<EOF
[Unit]
Description=IoT Data Logger (MQTT to Supabase)
After=network.target mosquitto.service
Requires=mosquitto.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/io-t-webpage
ExecStart=/usr/bin/python3 /home/pi/io-t-webpage/data_logger_updated.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable และ start services
sudo systemctl daemon-reload
sudo systemctl enable iot-config-manager
sudo systemctl enable iot-data-logger
sudo systemctl start iot-config-manager
sudo systemctl start iot-data-logger

# 7. ตรวจสอบสถานะ
sudo systemctl status iot-config-manager
sudo systemctl status iot-data-logger

# 8. ดู logs
journalctl -u iot-config-manager -f
journalctl -u iot-data-logger -f

# 9. ตรวจสอบว่า Mosquitto รันอยู่
sudo systemctl status mosquitto

# 10. ทดสอบระบบ
./test_mqtt_to_supabase.sh

echo "✅ Setup Complete!"
echo "📡 Config API: http://192.168.1.142:5000"
echo "📊 MQTT Broker: 192.168.1.142:1883"
