-- Create trigger to auto-insert alerts when ammonia exceeds thresholds
-- Thresholds:
--  - WARNING at > 25 ppm
--  - CRITICAL at > 50 ppm
-- Uses sensor_data.value or sensor_data.ammonia_ppm (if provided)

-- Function to evaluate a row and insert into device_alerts
CREATE OR REPLACE FUNCTION public.fn_create_ammonia_alert()
RETURNS trigger AS $$
DECLARE
  ppm real;
  severity text;
  msg text;
BEGIN
  -- Prefer ammonia_ppm; fall back to value
  ppm := COALESCE(NEW.ammonia_ppm, NEW.value);

  IF ppm IS NULL THEN
    RETURN NEW; -- nothing to do
  END IF;

  -- Determine severity
  IF ppm > 50 THEN
    severity := 'critical';
    msg := format('NH3 สูงมาก: %.2f ppm (เกณฑ์ 50 ppm)', ppm);
  ELSIF ppm > 25 THEN
    severity := 'warning';
    msg := format('NH3 เกินเกณฑ์: %.2f ppm (เกณฑ์ 25 ppm)', ppm);
  ELSE
    RETURN NEW; -- below threshold, no alert
  END IF;

  -- Insert alert
  INSERT INTO public.device_alerts (
    device_id,
    type,
    severity,
    message,
    created_at,
    updated_at,
    is_read
  ) VALUES (
    NEW.device_id,
    'threshold_exceeded',
    severity,
    msg,
    COALESCE(NEW.timestamp, now()),
    now(),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on insert to sensor_data
DROP TRIGGER IF EXISTS tr_create_ammonia_alert ON public.sensor_data;
CREATE TRIGGER tr_create_ammonia_alert
AFTER INSERT ON public.sensor_data
FOR EACH ROW
EXECUTE FUNCTION public.fn_create_ammonia_alert();
