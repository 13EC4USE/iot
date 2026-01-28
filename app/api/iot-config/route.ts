// app/api/iot-config/route.ts
// API endpoint สำหรับ forward config requests ไปยัง Pi

import { NextRequest, NextResponse } from 'next/server';

// URL ของ Pi config manager
const PI_CONFIG_URL = process.env.PI_CONFIG_URL || 'http://192.168.1.142:5000';

// Helper function: forward request ไปยัง Pi
async function forwardToPi(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: any
) {
  const url = `${PI_CONFIG_URL}/api/config${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      return {
        status: 'error',
        message: `Pi API error: ${response.status}`,
        pi_status: response.status,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error connecting to Pi config manager:', error);
    return {
      status: 'error',
      message: `Failed to connect to Pi config manager: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ==================================================
// GET /api/iot-config
// ดึง config ทั้งหมด
// ==================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const deviceId = searchParams.get('device_id');

  if (action === 'devices') {
    return NextResponse.json(
      await forwardToPi('/devices', 'GET')
    );
  }

  if (action === 'device' && deviceId) {
    return NextResponse.json(
      await forwardToPi(`/device/${deviceId}`, 'GET')
    );
  }

  if (action === 'mqtt') {
    return NextResponse.json(
      await forwardToPi('/mqtt', 'GET')
    );
  }

  // ดึง config ทั้งหมด (default)
  return NextResponse.json(
    await forwardToPi('', 'GET')
  );
}

// ==================================================
// POST /api/iot-config
// สร้าง/อัปเดต device config
// ==================================================
export async function POST(request: NextRequest) {
  const body = await request.json();
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const deviceId = searchParams.get('device_id');

  if (action === 'device' && deviceId) {
    return NextResponse.json(
      await forwardToPi(`/device/${deviceId}`, 'POST', body)
    );
  }

  if (action === 'mqtt') {
    return NextResponse.json(
      await forwardToPi('/mqtt', 'POST', body)
    );
  }

  if (action === 'reset') {
    return NextResponse.json(
      await forwardToPi('/reset', 'POST')
    );
  }

  return NextResponse.json(
    { status: 'error', message: 'Invalid action' },
    { status: 400 }
  );
}

// ==================================================
// DELETE /api/iot-config
// ลบ device
// ==================================================
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deviceId = searchParams.get('device_id');

  if (!deviceId) {
    return NextResponse.json(
      { status: 'error', message: 'device_id is required' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    await forwardToPi(`/device/${deviceId}`, 'DELETE')
  );
}
