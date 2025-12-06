-- Add ui_config JSONB column to devices table for storing widget customization
-- This allows users to customize how their devices appear on the dashboard

-- Add ui_config column if it doesn't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS ui_config JSONB DEFAULT NULL;

-- Create index for ui_config for faster queries
CREATE INDEX IF NOT EXISTS idx_devices_ui_config ON devices USING gin (ui_config);

-- Add comment to explain the column
COMMENT ON COLUMN devices.ui_config IS 'Stores device widget customization settings including widgetType, icon, color, min, max, and unit';

-- Example ui_config structure:
-- {
--   "widgetType": "gauge",  -- "switch" | "gauge" | "slider" | "stat"
--   "icon": "thermometer",   -- lucide-react icon name
--   "color": "blue",         -- color theme
--   "min": 0,               -- minimum value (for gauge/slider/stat)
--   "max": 100,             -- maximum value (for gauge/slider/stat)
--   "unit": "°C"            -- display unit
-- }
