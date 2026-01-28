import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // ดึงข้อมูล sensor_data ทั้งหมด (ไม่ต้อง auth)
    const { data, error, count } = await supabase
      .from('sensor_data')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        code: error.code 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: count,
      records: data?.length || 0,
      data: data || [],
      message: `Found ${data?.length || 0} sensor records`
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
