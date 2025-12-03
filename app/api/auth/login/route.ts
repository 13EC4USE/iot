import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Test credentials (in production use proper database)
    if (email === "admin@iot.com" && password === "password123") {
      return NextResponse.json({
        token: "test-token-" + Date.now(),
        message: "เข้าสู่ระบบสำเร็จ",
      })
    }

    return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 })
  }
}
