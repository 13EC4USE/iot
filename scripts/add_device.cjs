/**
 * Add New Sensor Script
 * node scripts/add_device.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
  console.log('\n📱 Add New IoT Sensor\n');
  
  // Get user ID
  console.log('Getting your admin user ID...');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ Not authenticated!');
    process.exit(1);
  }
  
  const user_id = user.id;
  console.log(`✅ User: ${user.email} (${user_id})\n`);
  
  // Input device details
  const device_name = await question('Device Name (e.g., Station_2): ');
  const mqtt_client_id = await question('MQTT Client ID (e.g., Station_2): ');
  const location = await question('Location (e.g., Pond B1): ');
  
  console.log('\n🔄 Creating device...');
  
  // Insert device
  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id,
      name: device_name,
      mqtt_client_id,
      location,
      device_type: 'ammonia_sensor',
      is_active: true
    })
    .select();
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  const device = data[0];
  const device_uuid = device.id;
  
  console.log('\n✅ Device Created!');
  console.log(`\n📋 Device Details:`);
  console.log(`  Name: ${device.name}`);
  console.log(`  UUID: ${device_uuid}`);
  console.log(`  MQTT ID: ${mqtt_client_id}`);
  console.log(`  Location: ${location}`);
  
  // Ask for alert thresholds
  const add_alerts = await question('\nAdd alert thresholds? (y/n): ');
  
  if (add_alerts.toLowerCase() === 'y') {
    const warning = await question('Warning threshold (ppm, default 30): ');
    const critical = await question('Critical threshold (ppm, default 50): ');
    
    const warn_val = parseFloat(warning) || 30;
    const crit_val = parseFloat(critical) || 50;
    
    const { error: alert_error } = await supabase
      .from('alert_thresholds')
      .insert({
        device_id: device_uuid,
        parameter: 'ammonia',
        warning_level: warn_val,
        critical_level: crit_val
      });
    
    if (alert_error) {
      console.error('⚠️  Warning: Could not set alerts:', alert_error.message);
    } else {
      console.log('✅ Alert thresholds set');
    }
  }
  
  // Generate Arduino code snippet
  console.log('\n\n=== Copy to Arduino IDE ===\n');
  console.log(`// Configuration for ${device_name}`);
  console.log(`const char* device_id = "${mqtt_client_id}";`);
  console.log(`const char* mqtt_topic = "iot/${mqtt_client_id}/ammonia";`);
  console.log(`#define DEVICE_UUID "${device_uuid}"`);
  console.log('\n=== End of Arduino Configuration ===\n');
  
  // MQTT topic info
  console.log('📡 MQTT Topic:');
  console.log(`  Subscribe on Pi: iot/${mqtt_client_id}/ammonia`);
  console.log('  Or use pattern: iot/+/ammonia\n');
  
  console.log('✅ Device ready! Upload code to ESP32.\n');
  
  rl.close();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
