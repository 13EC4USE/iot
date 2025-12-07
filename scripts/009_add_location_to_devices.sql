-- Add latitude and longitude columns to devices table
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_devices_location ON public.devices(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN public.devices.latitude IS 'Latitude coordinate of the device location';
COMMENT ON COLUMN public.devices.longitude IS 'Longitude coordinate of the device location';
