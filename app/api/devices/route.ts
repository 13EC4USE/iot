import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deviceSchema } from '@/lib/validators/schemas'
import { ZodError } from 'zod'

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

    const { data: devices, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(devices)
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

    const validatedData = deviceSchema.parse(body)

    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        user_id: user.id,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(device, { status: 201 })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[v0] POST /api/devices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
