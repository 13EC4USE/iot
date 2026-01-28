-- Create table to store alert thresholds (global or per device)
create table if not exists public.alert_thresholds (
  id bigserial primary key,
  device_id uuid references public.devices(id) on delete cascade,
  warn_threshold real not null default 25,
  crit_threshold real not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_thresholds_device_unique unique (device_id)
);

-- Seed a global default row
insert into public.alert_thresholds (device_id, warn_threshold, crit_threshold)
values (null, 25, 50)
on conflict (device_id) do update
set warn_threshold = excluded.warn_threshold,
    crit_threshold = excluded.crit_threshold,
    updated_at = now();
