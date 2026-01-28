-- Update trigger to use configurable thresholds from alert_thresholds
-- Assumes table alert_thresholds exists (see 013_create_alert_thresholds.sql)

create or replace function public.handle_ammonia_alert()
returns trigger as $$
declare
  warn_limit real := 25;
  crit_limit real := 50;
  device_name text;
begin
  select warn_threshold, crit_threshold
  into warn_limit, crit_limit
  from public.alert_thresholds
  where device_id is null
  limit 1;

  select name into device_name from public.devices where id = new.device_id;

  if new.value > crit_limit then
    insert into public.device_alerts (
      device_id,
      severity,
      type,
      message,
      metadata
    ) values (
      new.device_id,
      'critical',
      'threshold_exceeded',
      coalesce(device_name, 'Device') || ' เกินค่า Critical: ' || new.value || ' ppm',
      jsonb_build_object(
        'measured_value', new.value,
        'unit', 'ppm',
        'threshold', crit_limit,
        'field', 'ammonia_ppm'
      )
    );
  elsif new.value > warn_limit then
    insert into public.device_alerts (
      device_id,
      severity,
      type,
      message,
      metadata
    ) values (
      new.device_id,
      'warning',
      'threshold_exceeded',
      coalesce(device_name, 'Device') || ' เกินค่า Warning: ' || new.value || ' ppm',
      jsonb_build_object(
        'measured_value', new.value,
        'unit', 'ppm',
        'threshold', warn_limit,
        'field', 'ammonia_ppm'
      )
    );
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sensor_ammonia_alert on public.sensor_data;
create trigger trg_sensor_ammonia_alert
  after insert on public.sensor_data
  for each row
  when (new.value is not null)
  execute function public.handle_ammonia_alert();
