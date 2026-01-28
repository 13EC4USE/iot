-- Add Station_1 device to devices table
-- This device is already publishing to sensor_data with UUID 46588dc3-c4d1-4269-b626-90116c8b97a4

-- First, check if the device already exists
DO $$
DECLARE
  device_count INT;
  admin_user_id UUID;
BEGIN
  -- Check if device exists
  SELECT COUNT(*) INTO device_count
  FROM devices
  WHERE id = '46588dc3-c4d1-4269-b626-90116c8b97a4';

  IF device_count = 0 THEN
    -- Get admin user (or use the first user if no admin exists)
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@iot.com'
    LIMIT 1;

    -- If no admin user, use the first available user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id
      FROM auth.users
      LIMIT 1;
    END IF;

    -- Insert Station_1 device
    INSERT INTO devices (
      id,
      user_id,
      name,
      type,
      location,
      mac_address,
      mqtt_topic,
      is_active,
      power,
      battery_level,
      signal_strength,
      last_update
    ) VALUES (
      '46588dc3-c4d1-4269-b626-90116c8b97a4',
      admin_user_id,
      'Station 1 - Ammonia Sensor',
      'ammonia',
      'Test Location',
      'ESP32-Station1',
      'iot/Station_1/ammonia',
      true,
      true,
      100,
      85,
      NOW()
    );

    RAISE NOTICE 'Station_1 device created with UUID: 46588dc3-c4d1-4269-b626-90116c8b97a4';
  ELSE
    RAISE NOTICE 'Station_1 device already exists';
  END IF;
END $$;

-- Verify the device was created
SELECT id, name, type, location, mqtt_topic, is_active
FROM devices
WHERE id = '46588dc3-c4d1-4269-b626-90116c8b97a4';
