#!/usr/bin/env node
/**
 * สคริปต์ทดสอบ Workflow ทั้งหมด
 * ยิงข้อมูลทดสอบไปยัง MQTT และ Supabase
 */

const mqtt = require('mqtt');
const { createClient } = require('@supabase/supabase-js');

// ========================================
// 📝 กำหนดค่าที่นี่
// ========================================
const MQTT_BROKER = 'mqtt://192.168.1.142:1883';
const DEVICE_ID = 'Station_1';
const TOPIC = `iot/${DEVICE_ID}/ammonia`;

// Supabase Config (ใส่ค่าจริงของคุณ)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// UUID ของอุปกรณ์ในฐานข้อมูล (ดูจากหน้า /admin/devices)
const DEVICE_UUID = '46588dc3-c4d1-4269-b626-90116c8b97a4';

// ========================================
// 🧪 ฟังก์ชันทดสอบ MQTT
// ========================================
async function testMQTT() {
  return new Promise((resolve, reject) => {
    console.log('\n📡 กำลังทดสอบ MQTT...');
    console.log(`   Broker: ${MQTT_BROKER}`);
    console.log(`   Topic: ${TOPIC}`);

    const client = mqtt.connect(MQTT_BROKER);

    client.on('connect', () => {
      console.log('✅ เชื่อมต่อ MQTT Broker สำเร็จ\n');

      // สร้างข้อมูลทดสอบ
      const testData = {
        device_id: DEVICE_ID,
        ammonia_ppm: Math.random() * 50 + 10, // 10-60 ppm
        temperature: Math.random() * 10 + 25,  // 25-35°C
        humidity: Math.random() * 20 + 60,     // 60-80%
        timestamp: new Date().toISOString()
      };

      console.log('📤 ส่งข้อมูลทดสอบ:');
      console.log(JSON.stringify(testData, null, 2));
      console.log('');

      client.publish(TOPIC, JSON.stringify(testData), (err) => {
        if (err) {
          console.error('❌ ส่งข้อมูล MQTT ล้มเหลว:', err.message);
          client.end();
          reject(err);
        } else {
          console.log('✅ ส่งข้อมูลผ่าน MQTT สำเร็จ');
          client.end();
          resolve(testData);
        }
      });
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Error:', err.message);
      reject(err);
    });

    setTimeout(() => {
      client.end();
      reject(new Error('MQTT Timeout'));
    }, 5000);
  });
}

// ========================================
// 💾 ฟังก์ชันทดสอบ Supabase
// ========================================
async function testSupabase(testData) {
  console.log('\n💾 กำลังทดสอบ Supabase...');
  console.log(`   URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log(`   Device UUID: ${DEVICE_UUID}`);

  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.log('⚠️  กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_KEY');
    console.log('   export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"');
    console.log('   export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxx..."');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // บันทึกข้อมูลลง sensor_data (ใช้เวลาปัจจุบัน)
    const { data, error } = await supabase
      .from('sensor_data')
      .insert({
        device_id: DEVICE_UUID,
        value: testData.ammonia_ppm,
        unit: 'ppm',
        temperature: testData.temperature,
        humidity: testData.humidity,
        timestamp: new Date().toISOString() // ใช้เวลาจริง ไม่ใช่ test data
      })
      .select();

    if (error) {
      console.error('❌ บันทึกลง Supabase ล้มเหลว:', error.message);
      console.log('\n🔍 ตรวจสอบ:');
      console.log('   1. Device UUID ถูกต้องหรือไม่?');
      console.log('   2. ตาราง sensor_data มีอยู่หรือไม่?');
      console.log('   3. RLS policies อนุญาตให้ insert ได้หรือไม่?');
      return;
    }

    console.log('✅ บันทึกลง Supabase สำเร็จ');
    console.log('   Record ID:', data[0].id);
    console.log('   Timestamp:', data[0].timestamp);

    // ตรวจสอบจำนวนข้อมูลทั้งหมด
    const { count } = await supabase
      .from('sensor_data')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', DEVICE_UUID);

    console.log(`   Total records: ${count || 0} รายการ`);
  } catch (err) {
    console.error('❌ Supabase Error:', err.message);
  }
}

// ========================================
// 🔄 ฟังก์ชันทดสอบแบบต่อเนื่อง
// ========================================
async function testContinuous(interval = 5000, count = 10) {
  console.log(`\n🔄 ทดสอบส่งข้อมูลต่อเนื่อง (${count} ครั้ง, ทุก ${interval/1000} วินาที)\n`);
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 รอบที่ ${i}/${count}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const testData = await testMQTT();
      await testSupabase(testData);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }

    if (i < count) {
      console.log(`\n⏳ รอ ${interval/1000} วินาที...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  console.log('\n\n✅ ทดสอบเสร็จสิ้น!');
  console.log('🌐 ตรวจสอบผลลัพธ์ที่: http://localhost:3000/admin/workflow');
}

// ========================================
// 🚀 Main
// ========================================
const args = process.argv.slice(2);
const mode = args[0] || 'once';

console.log('╔════════════════════════════════════════╗');
console.log('║   🧪 สคริปต์ทดสอบ IoT Workflow        ║');
console.log('╚════════════════════════════════════════╝');

switch (mode) {
  case 'once':
    console.log('\n📌 โหมด: ทดสอบครั้งเดียว');
    (async () => {
      try {
        const testData = await testMQTT();
        await testSupabase(testData);
        console.log('\n✅ เสร็จสิ้น!');
        process.exit(0);
      } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
      }
    })();
    break;

  case 'continuous':
    const interval = parseInt(args[1]) || 5000;
    const count = parseInt(args[2]) || 10;
    testContinuous(interval, count).then(() => process.exit(0));
    break;

  case 'mqtt':
    console.log('\n📌 โหมด: ทดสอบ MQTT อย่างเดียว');
    testMQTT()
      .then(() => {
        console.log('\n✅ เสร็จสิ้น!');
        process.exit(0);
      })
      .catch(err => {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
      });
    break;

  case 'supabase':
    console.log('\n📌 โหมด: ทดสอบ Supabase อย่างเดียว');
    const mockData = {
      ammonia_ppm: 35.5,
      temperature: 28.3,
      humidity: 65.2,
      timestamp: new Date().toISOString()
    };
    testSupabase(mockData).then(() => process.exit(0));
    break;

  default:
    console.log('\n❌ โหมดไม่ถูกต้อง');
    console.log('\nวิธีใช้งาน:');
    console.log('  node test_workflow.cjs once           - ทดสอบครั้งเดียว');
    console.log('  node test_workflow.cjs mqtt           - ทดสอบ MQTT เท่านั้น');
    console.log('  node test_workflow.cjs supabase       - ทดสอบ Supabase เท่านั้น');
    console.log('  node test_workflow.cjs continuous 3000 20  - ทดสอบต่อเนื่อง 20 ครั้ง ทุก 3 วินาที');
    process.exit(1);
}
