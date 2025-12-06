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

    // Compute online/offline based on latest sensor_data timestamp or last_update
    const ONLINE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
    const deviceIds = devices.map((d) => d.id)

    const { data: latestData } = await supabase
      .from('sensor_data')
      .select('device_id, timestamp')
      .in('device_id', deviceIds)
      .order('timestamp', { ascending: false })

    const lastSeenMap = new Map<string, string>()
    if (latestData) {
      for (const row of latestData as { device_id: string; timestamp: string }[]) {
        if (!lastSeenMap.has(row.device_id)) {
          lastSeenMap.set(row.device_id, row.timestamp)
        }
      }
    }

    const now = Date.now()
    const enriched = devices.map((d) => {
      const lastSeen = lastSeenMap.get(d.id) || d.last_update || d.updated_at
      const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : null
      const online = lastSeenMs ? now - lastSeenMs < ONLINE_WINDOW_MS : false

      return {
        ...d,
        status_online: online,
        status_last_seen: lastSeen,
        status_source: lastSeenMap.has(d.id) ? 'sensor_data' : 'device_row',
      }
    })

    return NextResponse.json(enriched)
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
