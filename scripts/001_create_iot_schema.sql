-- Create users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'user',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create devices table
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null,
  location text,
  mac_address text unique,
  mqtt_topic text unique,
  is_active boolean default true,
  power boolean default true,
  battery_level integer default 100,
  signal_strength integer default 100,
  last_update timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create sensor_data table
create table if not exists public.sensor_data (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  value real not null,
  unit text,
  temperature real,
  humidity real,
  timestamp timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Create device_alerts table
create table if not exists public.device_alerts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  type text not null,
  severity text,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create device_settings table
create table if not exists public.device_settings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade unique,
  min_threshold real,
  max_threshold real,
  alert_enabled boolean default true,
  update_interval integer default 60,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.devices enable row level security;
alter table public.sensor_data enable row level security;
alter table public.device_alerts enable row level security;
alter table public.device_settings enable row level security;

-- Create RLS Policies for users table
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Create RLS Policies for devices table
create policy "devices_select_own" on public.devices for select using (auth.uid() = user_id);
create policy "devices_insert_own" on public.devices for insert with check (auth.uid() = user_id);
create policy "devices_update_own" on public.devices for update using (auth.uid() = user_id);
create policy "devices_delete_own" on public.devices for delete using (auth.uid() = user_id);

-- Create RLS Policies for sensor_data table
create policy "sensor_data_select_own" on public.sensor_data for select 
  using (exists (select 1 from public.devices d where d.id = sensor_data.device_id and d.user_id = auth.uid()));
create policy "sensor_data_insert_own" on public.sensor_data for insert 
  with check (exists (select 1 from public.devices d where d.id = sensor_data.device_id and d.user_id = auth.uid()));

-- Create RLS Policies for device_alerts table
create policy "device_alerts_select_own" on public.device_alerts for select 
  using (exists (select 1 from public.devices d where d.id = device_alerts.device_id and d.user_id = auth.uid()));
create policy "device_alerts_insert_own" on public.device_alerts for insert 
  with check (exists (select 1 from public.devices d where d.id = device_alerts.device_id and d.user_id = auth.uid()));

-- Create RLS Policies for device_settings table
create policy "device_settings_select_own" on public.device_settings for select 
  using (exists (select 1 from public.devices d where d.id = device_settings.device_id and d.user_id = auth.uid()));
create policy "device_settings_insert_own" on public.device_settings for insert 
  with check (exists (select 1 from public.devices d where d.id = device_settings.device_id and d.user_id = auth.uid()));
create policy "device_settings_update_own" on public.device_settings for update 
  using (exists (select 1 from public.devices d where d.id = device_settings.device_id and d.user_id = auth.uid()));

-- Create indexes for performance
create index devices_user_id_idx on public.devices(user_id);
create index devices_mqtt_topic_idx on public.devices(mqtt_topic);
create index sensor_data_device_id_idx on public.sensor_data(device_id);
create index sensor_data_timestamp_idx on public.sensor_data(timestamp);
create index device_alerts_device_id_idx on public.device_alerts(device_id);
create index device_settings_device_id_idx on public.device_settings(device_id);
