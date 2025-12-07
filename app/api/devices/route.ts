import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deviceSchema } from '@/lib/validators/schemas'
import { ZodError } from 'zod'
import { isSuperAdmin } from '@/lib/utils/admin'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = isSuperAdmin(user.email)

    let query = supabase
      .from('devices')
      .select('*')

    // Only filter by user_id if NOT admin
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: devices, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no devices, return early
    if (!devices || devices.length === 0) {
      return NextResponse.json([])
    }

    const ONLINE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
    const deviceIds = devices.map((d) => d.id)
    const now = Date.now()

    // Fetch sensor data and ui_configs in parallel (2 queries instead of 3)
    const [sensorDataResult, uiConfigsResult] = await Promise.all([
      supabase
        .from('sensor_data')
        .select('device_id, temperature, humidity, value, timestamp')
        .in('device_id', deviceIds)
        .order('timestamp', { ascending: false }),
      supabase
        .from('device_ui_config')
        .select('device_id, widget_type, icon, color, min, max, unit')
        .in('device_id', deviceIds)
    ])

    // Build maps with deduplication for latest sensor data
    const sensorDataMap = new Map()
    const lastSeenMap = new Map<string, string>()
    
    if (sensorDataResult.data) {
      for (const row of sensorDataResult.data as any[]) {
        if (!sensorDataMap.has(row.device_id)) {
          sensorDataMap.set(row.device_id, row)
        }
        if (!lastSeenMap.has(row.device_id)) {
          lastSeenMap.set(row.device_id, row.timestamp)
        }
      }
    }

    const uiConfigMap = new Map()
    if (uiConfigsResult.data) {
      for (const config of uiConfigsResult.data as any[]) {
        uiConfigMap.set(config.device_id, {
          widgetType: config.widget_type || 'switch',
          icon: config.icon || 'zap',
          color: config.color || 'blue',
          min: config.min || 0,
          max: config.max || 100,
          unit: config.unit || '%',
        })
      }
    }

    // Enrich devices with sensor data, ui_config, and online status
    const enrichedDevices = devices.map((d) => {
      const lastSeen = lastSeenMap.get(d.id) || d.last_update || d.updated_at
      const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : null
      const isOnline = lastSeenMs ? now - lastSeenMs < ONLINE_WINDOW_MS : false

      return {
        ...d,
        status_online: isOnline,
        status_last_seen: lastSeen,
        status_source: lastSeenMap.has(d.id) ? 'sensor_data' : 'device_row',
        lastData: sensorDataMap.get(d.id),
        ui_config: uiConfigMap.get(d.id) || {
          widgetType: 'switch',
          icon: 'zap',
          color: 'blue',
          min: 0,
          max: 100,
          unit: '%',
        }
      }
    })

    return NextResponse.json(enrichedDevices)
  } catch (error: any) {
    console.error('[v0] GET /api/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Sanitize empty strings to undefined so optional fields pass validation
    const sanitizedBody = {
      ...body,
      mac_address: body?.mac_address?.trim() || undefined,
      mqtt_topic: body?.mqtt_topic?.trim() || undefined,
      location: body?.location?.trim() || undefined,
      name: body?.name?.trim() ?? body?.name,
    }

    const validatedData = deviceSchema.parse(sanitizedBody)

    // Ensure user profile row exists (in case trigger wasn't run)
    await supabase
      .from('users')
      .upsert({ id: user.id, email: user.email ?? null })
      .select()

    // Generate MQTT credentials (persisted to DB)
    const tempId = Date.now()
    const clientId = `device_${user.id.substring(0, 8)}_${tempId}`
    const username = `mqtt_${user.id.substring(0, 8)}_${tempId}`
    const password = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    const host = process.env.NEXT_PUBLIC_MQTT_HOST || 'localhost'

    // Auto-generate mqtt_topic if not provided
    const mqtt_topic = validatedData.mqtt_topic || `iot/${user.id.substring(0, 8)}/${tempId}`

    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        ...validatedData,
        mqtt_topic,
        mqtt_client_id: clientId,
        mqtt_username: username,
        mqtt_password: password,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return device data with credentials
    return NextResponse.json({
      success: true,
      data: {
        ...device,
        Host: host,
        ClientID: clientId,
        Username: username,
        Password: password,
      }
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[v0] POST /api/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
