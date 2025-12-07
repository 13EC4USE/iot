import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Get latest sensor data for each device
    // First, get the devices the user has access to
    let devicesQuery = supabase.from('devices').select('id, user_id')
    
    if (!isAdmin) {
      devicesQuery = devicesQuery.eq('user_id', user.id)
    }

    const { data: devices, error: devicesError } = await devicesQuery

    if (devicesError) {
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json([])
    }

    const deviceIds = devices.map((d) => d.id)

    // Get the latest sensor data for each device
    const { data: sensorData, error: sensorError } = await supabase
      .from('sensor_data')
      .select('device_id, temperature, humidity, timestamp')
      .in('device_id', deviceIds)
      .order('timestamp', { ascending: false })

    if (sensorError) {
      return NextResponse.json({ error: sensorError.message }, { status: 500 })
    }

    // Get only the latest reading for each device
    const latestDataMap = new Map()
    if (sensorData) {
      for (const data of sensorData) {
        if (!latestDataMap.has(data.device_id)) {
          latestDataMap.set(data.device_id, data)
        }
      }
    }

    const result = Array.from(latestDataMap.values())

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[v0] GET /api/devices/sensor-data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
