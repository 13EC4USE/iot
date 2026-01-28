#!/bin/bash
# stop_data_logger.sh - หยุด data logger บน Pi

echo "🛑 Stopping Data Logger..."

# หา process ID ของ data_logger_updated.py
PID=$(pgrep -f "data_logger_updated.py")

if [ -z "$PID" ]; then
    echo "ℹ️  Data logger is not running"
else
    echo "   Found PID: $PID"
    kill $PID
    sleep 2
    
    # ตรวจสอบว่าหยุดแล้วหรือยัง
    if pgrep -f "data_logger_updated.py" > /dev/null; then
        echo "⚠️  Force stopping..."
        kill -9 $PID
    fi
    
    echo "✅ Data logger stopped"
fi
