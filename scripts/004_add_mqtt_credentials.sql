-- Add MQTT credentials columns to devices table
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS mqtt_client_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS mqtt_username TEXT,
ADD COLUMN IF NOT EXISTS mqtt_password TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_mqtt_client_id ON public.devices(mqtt_client_id);
CREATE INDEX IF NOT EXISTS idx_devices_mqtt_username ON public.devices(mqtt_username);

-- Add comment for documentation
COMMENT ON COLUMN public.devices.mqtt_client_id IS 'Unique MQTT client identifier for device authentication';
COMMENT ON COLUMN public.devices.mqtt_username IS 'MQTT username/token for device connection';
COMMENT ON COLUMN public.devices.mqtt_password IS 'MQTT password/secret for device connection (hashed in production)';
