-- Add battery_level to sensor_data table (if devices send battery info per reading)
ALTER TABLE public.sensor_data 
ADD COLUMN IF NOT EXISTS battery_level integer;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_data_battery_level ON public.sensor_data(battery_level);

COMMENT ON COLUMN public.sensor_data.battery_level IS 'Battery level percentage (0-100) at time of reading';
