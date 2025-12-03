import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1. ตรวจสอบว่าผู้ใช้ล็อกอินหรือยัง
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // ถ้ายังไม่ล็อกอิน, ส่งกลับข้อผิดพลาด 401 Unauthorized
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. ถ้าล็อกอินแล้ว, ดึงข้อมูลลับจาก Server Environment Variables
  const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD; // <-- ใช้ตัวแปรใหม่ที่ปลอดภัย

  if (!username || !password) {
    console.error('MQTT credentials are not configured on the server.');
    return new NextResponse(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
  }

  // 3. ส่ง credentials กลับไปให้ Client
  return NextResponse.json({ username, password });
}