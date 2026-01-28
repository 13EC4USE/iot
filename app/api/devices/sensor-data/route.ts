import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
    const queryClient = isAdmin ? createAdminClient() : supabase

    // Get latest sensor data for each device
    // First, get the devices the user has access to
    let devicesQuery = queryClient.from('devices').select('id, user_id')
    
    if (!isAdmin) {
      devicesQuery = devicesQuery.eq('user_id', user.id)
    }

    const { data: devices, error: devicesError } = await devicesQuery

    if (devicesError) {
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    if (!devices || devices.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0
      })
    }

    const deviceIds = devices.map((d) => d.id)

    // Get the latest sensor data for each device
    const { data: sensorData, error: sensorError } = await queryClient
      .from('sensor_data')
      .select('*')
      .in('device_id', deviceIds)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (sensorError) {
      return NextResponse.json({ error: sensorError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: sensorData || [],
      count: sensorData?.length || 0
    })
  } catch (error: any) {
    console.error('Sensor data error:', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
