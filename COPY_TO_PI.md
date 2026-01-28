# คำสั่งสำหรับ Copy ไฟล์จาก Windows ไป Raspberry Pi

# ============================================
# Option 1: ใช้ SCP (Secure Copy) ผ่าน PowerShell
# ============================================

# Copy ไฟล์ Python scripts
scp data_logger_updated.py pi@192.168.1.142:/home/pi/io-t-webpage/
scp config_manager_pi.py pi@192.168.1.142:/home/pi/io-t-webpage/
scp iot_config.json pi@192.168.1.142:/home/pi/io-t-webpage/

# Copy shell scripts
scp test_mqtt_to_supabase.sh pi@192.168.1.142:/home/pi/io-t-webpage/
scp setup_pi.sh pi@192.168.1.142:/home/pi/io-t-webpage/

# Copy documentation
scp TESTING_GUIDE.md pi@192.168.1.142:/home/pi/io-t-webpage/

# ============================================
# Option 2: ใช้ WinSCP (GUI)
# ============================================
# 1. ดาวน์โหลดและติดตั้ง WinSCP จาก https://winscp.net/
# 2. เชื่อมต่อไปที่:
#    - Host: 192.168.1.142
#    - Username: pi
#    - Password: (รหัสผ่าน Pi ของคุณ)
# 3. Drag & drop ไฟล์ไปที่ /home/pi/io-t-webpage/

# ============================================
# Option 3: ใช้ SSH + Git
# ============================================
# 1. Push โค้ดไป GitHub/GitLab
# 2. SSH เข้า Pi และ git clone

# SSH เข้า Pi
ssh pi@192.168.1.142

# จากนั้น clone repository
# cd /home/pi
# git clone <your-repo-url> io-t-webpage

# ============================================
# หลังจาก copy เสร็จ
# ============================================
# SSH เข้า Pi
ssh pi@192.168.1.142

# รันคำสั่งติดตั้ง
cd /home/pi/io-t-webpage
chmod +x setup_pi.sh
./setup_pi.sh
