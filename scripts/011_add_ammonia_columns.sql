-- Add ammonia-specific columns to sensor_data table
-- This adds calibrated_ro (sensor calibration value) and ammonia_ppm (explicit ammonia reading)

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add calibrated_ro column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_data' AND column_name = 'calibrated_ro'
  ) THEN
    ALTER TABLE public.sensor_data ADD COLUMN calibrated_ro real;
    RAISE NOTICE 'Added calibrated_ro column';
  END IF;

  -- Add ammonia_ppm column (explicit ammonia reading, in addition to value field)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_data' AND column_name = 'ammonia_ppm'
  ) THEN
    ALTER TABLE public.sensor_data ADD COLUMN ammonia_ppm real;
    RAISE NOTICE 'Added ammonia_ppm column';
  END IF;

  -- Add station_id column for easier filtering
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sensor_data' AND column_name = 'station_id'
  ) THEN
    ALTER TABLE public.sensor_data ADD COLUMN station_id text;
    RAISE NOTICE 'Added station_id column';
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp 
  ON public.sensor_data(device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_data_station_timestamp 
  ON public.sensor_data(station_id, timestamp DESC);

-- Add comment
COMMENT ON COLUMN public.sensor_data.calibrated_ro IS 'MQ-137 sensor calibrated resistance value';
COMMENT ON COLUMN public.sensor_data.ammonia_ppm IS 'Ammonia concentration in PPM';
COMMENT ON COLUMN public.sensor_data.station_id IS 'Station identifier (e.g., Station_1, Station_2)';

-- Verify columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sensor_data'
ORDER BY ordinal_position;
