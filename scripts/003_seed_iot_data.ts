import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  console.log("Starting seed data...")

  try {
    // Create test users
    console.log("Creating test users...")
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: "admin@iot.com",
      password: "Admin@123456",
      email_confirm: true,
    })

    if (userError) {
      console.error("User creation error:", userError.message)
    } else {
      console.log("Admin user created:", userData.user?.id)

      // Update user profile
      await supabase.from("users").insert({
        id: userData.user?.id,
        email: "admin@iot.com",
        full_name: "Admin User",
        role: "admin",
      })
    }

    // Create test user
    const { data: testUserData, error: testUserError } = await supabase.auth.admin.createUser({
      email: "user@iot.com",
      password: "User@123456",
      email_confirm: true,
    })

    if (testUserError) {
      console.error("Test user creation error:", testUserError.message)
    } else {
      console.log("Test user created:", testUserData.user?.id)

      await supabase.from("users").insert({
        id: testUserData.user?.id,
        email: "user@iot.com",
        full_name: "Test User",
        role: "user",
      })

      // Create test devices
      console.log("Creating test devices...")
      const devices = [
        {
          user_id: testUserData.user?.id,
          name: "Temperature Sensor - Living Room",
          type: "temperature",
          location: "Living Room",
          mac_address: "AA:BB:CC:DD:EE:01",
          mqtt_topic: "iot/temp/living-room",
          is_active: true,
          power: true,
          battery_level: 95,
          signal_strength: 85,
        },
        {
          user_id: testUserData.user?.id,
          name: "Humidity Sensor - Bedroom",
          type: "humidity",
          location: "Bedroom",
          mac_address: "AA:BB:CC:DD:EE:02",
          mqtt_topic: "iot/humidity/bedroom",
          is_active: true,
          power: true,
          battery_level: 88,
          signal_strength: 90,
        },
        {
          user_id: testUserData.user?.id,
          name: "Motion Sensor - Kitchen",
          type: "motion",
          location: "Kitchen",
          mac_address: "AA:BB:CC:DD:EE:03",
          mqtt_topic: "iot/motion/kitchen",
          is_active: true,
          power: true,
          battery_level: 92,
          signal_strength: 88,
        },
        {
          user_id: testUserData.user?.id,
          name: "Smart Light - Hallway",
          type: "light",
          location: "Hallway",
          mac_address: "AA:BB:CC:DD:EE:04",
          mqtt_topic: "iot/light/hallway",
          is_active: true,
          power: true,
          battery_level: 100,
          signal_strength: 95,
        },
      ]

      const { data: devicesData, error: devicesError } = await supabase.from("devices").insert(devices).select()

      if (devicesError) {
        console.error("Devices creation error:", devicesError.message)
      } else {
        console.log("Devices created:", devicesData?.length)

        // Create sensor data for each device
        console.log("Creating sensor data...")
        const sensorDataRecords = []

        if (devicesData) {
          for (const device of devicesData) {
            for (let i = 0; i < 24; i++) {
              const timestamp = new Date(Date.now() - i * 3600000)
              sensorDataRecords.push({
                device_id: device.id,
                value: Math.random() * 100,
                unit: device.type === "temperature" ? "°C" : device.type === "humidity" ? "%" : "units",
                temperature: device.type === "temperature" ? 20 + Math.random() * 10 : null,
                humidity: device.type === "humidity" ? 40 + Math.random() * 40 : null,
                timestamp: timestamp.toISOString(),
              })
            }
          }

          const { error: sensorError } = await supabase.from("sensor_data").insert(sensorDataRecords)

          if (sensorError) {
            console.error("Sensor data creation error:", sensorError.message)
          } else {
            console.log("Sensor data created:", sensorDataRecords.length)
          }

          // Create device settings
          console.log("Creating device settings...")
          const settings = devicesData.map((device) => ({
            device_id: device.id,
            min_threshold: 15,
            max_threshold: 35,
            alert_enabled: true,
            update_interval: 60,
          }))

          const { error: settingsError } = await supabase.from("device_settings").insert(settings)

          if (settingsError) {
            console.error("Settings creation error:", settingsError.message)
          } else {
            console.log("Device settings created:", settings.length)
          }

          // Create sample alerts
          console.log("Creating sample alerts...")
          const alerts = devicesData.slice(0, 2).map((device) => ({
            device_id: device.id,
            type: "threshold_exceeded",
            severity: "warning",
            message: `${device.name} temperature exceeded threshold`,
            is_read: false,
          }))

          const { error: alertsError } = await supabase.from("device_alerts").insert(alerts)

          if (alertsError) {
            console.error("Alerts creation error:", alertsError.message)
          } else {
            console.log("Alerts created:", alerts.length)
          }
        }
      }
    }

    console.log("Seed data completed successfully!")
  } catch (error) {
    console.error("Seed error:", error)
    process.exit(1)
  }
}

seedData()
