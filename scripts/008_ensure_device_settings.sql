-- Ensure all devices have device_settings records
-- This script creates default settings for devices that don't have them yet

-- Insert default settings for devices without settings
INSERT INTO public.device_settings (device_id, min_threshold, max_threshold, alert_enabled, update_interval)
SELECT 
  d.id,
  20.0,  -- default min threshold
  30.0,  -- default max threshold
  true,  -- default alert enabled
  60     -- default update interval (60 seconds)
FROM public.devices d
LEFT JOIN public.device_settings ds ON d.id = ds.device_id
WHERE ds.id IS NULL;

-- Show results
SELECT 
  d.name,
  d.type,
  ds.min_threshold,
  ds.max_threshold,
  ds.alert_enabled,
  ds.update_interval
FROM public.devices d
LEFT JOIN public.device_settings ds ON d.id = ds.device_id
ORDER BY d.created_at DESC;
